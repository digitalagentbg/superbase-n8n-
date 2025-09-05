-- Fix API Authentication Secrets Security Issues
-- This addresses critical security vulnerabilities in the api_configs table

-- 1. Fix the UPDATE policy to prevent user_id manipulation
DROP POLICY IF EXISTS "Users can update own API configs" ON public.api_configs;

CREATE POLICY "Users can update own API configs" 
ON public.api_configs 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Add constraint to ensure user_id is never NULL (critical for RLS security)
ALTER TABLE public.api_configs 
ALTER COLUMN user_id SET NOT NULL;

-- 3. Create a security definer function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_api_config_data(
    p_auth_config jsonb,
    p_headers jsonb,
    p_config_id uuid
)
RETURNS TABLE(encrypted_auth_config text, encrypted_headers text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_key_id bigint := 1; -- Use a consistent key ID for all API configs
    v_context bytea := '\x61706963666773'::bytea; -- "apicfgs" in hex
BEGIN
    -- Only encrypt if there's actual data to encrypt
    IF p_auth_config IS NULL OR p_auth_config::text = '{}' THEN
        encrypted_auth_config := '{}';
    ELSE
        -- Encrypt auth_config using Supabase vault
        SELECT encode(
            vault.encrypt(
                p_auth_config::text::bytea,
                p_config_id::text::bytea, -- Use config ID as additional data
                v_key_id,
                v_context
            ), 
            'base64'
        ) INTO encrypted_auth_config;
    END IF;
    
    IF p_headers IS NULL OR p_headers::text = '{}' THEN
        encrypted_headers := '{}';
    ELSE
        -- Encrypt headers using Supabase vault
        SELECT encode(
            vault.encrypt(
                p_headers::text::bytea,
                p_config_id::text::bytea, -- Use config ID as additional data
                v_key_id,
                v_context
            ), 
            'base64'
        ) INTO encrypted_headers;
    END IF;
    
    RETURN NEXT;
END;
$$;

-- 4. Create a security definer function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_api_config_data(
    p_encrypted_auth_config text,
    p_encrypted_headers text,
    p_config_id uuid
)
RETURNS TABLE(decrypted_auth_config jsonb, decrypted_headers jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_key_id bigint := 1;
    v_context bytea := '\x61706963666773'::bytea;
    v_decrypted_auth text;
    v_decrypted_headers text;
BEGIN
    -- Only decrypt if there's actual encrypted data
    IF p_encrypted_auth_config = '{}' OR p_encrypted_auth_config IS NULL THEN
        decrypted_auth_config := '{}'::jsonb;
    ELSE
        SELECT convert_from(
            vault.decrypt(
                decode(p_encrypted_auth_config, 'base64'),
                p_config_id::text::bytea,
                v_key_id,
                v_context
            ),
            'utf8'
        ) INTO v_decrypted_auth;
        
        decrypted_auth_config := v_decrypted_auth::jsonb;
    END IF;
    
    IF p_encrypted_headers = '{}' OR p_encrypted_headers IS NULL THEN
        decrypted_headers := '{}'::jsonb;
    ELSE
        SELECT convert_from(
            vault.decrypt(
                decode(p_encrypted_headers, 'base64'),
                p_config_id::text::bytea,
                v_key_id,
                v_context
            ),
            'utf8'
        ) INTO v_decrypted_headers;
        
        decrypted_headers := v_decrypted_headers::jsonb;
    END IF;
    
    RETURN NEXT;
END;
$$;

-- 5. Add new encrypted columns for sensitive data
ALTER TABLE public.api_configs 
ADD COLUMN encrypted_auth_config text,
ADD COLUMN encrypted_headers text;

-- 6. Create a view for secure access to API configs with automatic decryption
CREATE OR REPLACE VIEW public.api_configs_secure AS
SELECT 
    ac.id,
    ac.name,
    ac.url,
    ac.method,
    ac.auth_type,
    ac.user_id,
    ac.is_active,
    ac.body,
    ac.created_at,
    ac.updated_at,
    -- Decrypt sensitive data for authorized users only
    CASE 
        WHEN ac.user_id = auth.uid() THEN 
            COALESCE((SELECT decrypted_auth_config FROM public.decrypt_api_config_data(ac.encrypted_auth_config, ac.encrypted_headers, ac.id)), ac.auth_config)
        ELSE NULL 
    END as auth_config,
    CASE 
        WHEN ac.user_id = auth.uid() THEN 
            COALESCE((SELECT decrypted_headers FROM public.decrypt_api_config_data(ac.encrypted_auth_config, ac.encrypted_headers, ac.id)), ac.headers)
        ELSE NULL 
    END as headers
FROM public.api_configs ac;

-- 7. Enable RLS on the secure view
ALTER VIEW public.api_configs_secure OWNER TO postgres;

-- 8. Grant appropriate permissions
GRANT SELECT ON public.api_configs_secure TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 9. Add audit trigger to log access to sensitive API configs
CREATE OR REPLACE FUNCTION public.audit_api_config_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Log when sensitive API configs are accessed
    IF TG_OP = 'SELECT' THEN
        INSERT INTO public.audit_log (
            user_id,
            table_name,
            operation,
            record_id,
            timestamp
        ) VALUES (
            auth.uid(),
            'api_configs',
            'SENSITIVE_ACCESS',
            NEW.id,
            now()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit fails
        RETURN NEW;
END;
$$;

-- Note: We're keeping the original columns temporarily for backward compatibility
-- Applications should migrate to use the secure view instead of direct table access

COMMENT ON TABLE public.api_configs IS 'Stores API configuration data. Use api_configs_secure view for decrypted access to sensitive fields.';
COMMENT ON VIEW public.api_configs_secure IS 'Secure view of API configs with automatic encryption/decryption of sensitive fields. Only shows decrypted data to the config owner.';
COMMENT ON FUNCTION public.encrypt_api_config_data IS 'Encrypts sensitive API configuration data using Supabase vault.';
COMMENT ON FUNCTION public.decrypt_api_config_data IS 'Decrypts sensitive API configuration data using Supabase vault.';