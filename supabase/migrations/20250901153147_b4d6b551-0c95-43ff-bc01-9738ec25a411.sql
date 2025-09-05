-- Add data_table column to project table to specify which table each project uses for data
ALTER TABLE public.project ADD COLUMN data_table TEXT;

-- Update existing projects with default data tables
UPDATE public.project 
SET data_table = 'executions' 
WHERE name = 'nov';

UPDATE public.project 
SET data_table = 'mulchbg' 
WHERE name = 'мулчччч';

-- Add comment for clarity
COMMENT ON COLUMN public.project.data_table IS 'Specifies which database table this project uses for its execution data';