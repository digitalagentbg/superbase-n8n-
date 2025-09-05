-- Create storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', false);

-- Create RLS policies for the bucket
CREATE POLICY "Users can view files in their assigned tenant"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM tenants t 
    JOIN profiles p ON p.tenant_id = t.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can upload files to any tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents' 
  AND is_current_user_admin()
);

CREATE POLICY "Users can upload files to their tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM tenants t 
    JOIN profiles p ON p.tenant_id = t.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete files from any tenant folder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-documents' 
  AND is_current_user_admin()
);

CREATE POLICY "Users can delete files from their tenant folder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text 
    FROM tenants t 
    JOIN profiles p ON p.tenant_id = t.id 
    WHERE p.user_id = auth.uid()
  )
);