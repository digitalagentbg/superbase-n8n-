-- Enable real-time for tenants table
ALTER TABLE public.tenants REPLICA IDENTITY FULL;

-- Create sample documents for testing
INSERT INTO public.documents (content, metadata) VALUES 
('Sample document 1 content for mulchbg project', '{"title": "Project Overview", "type": "report", "tenant_id": "632b88da-2f15-481e-be49-613103d1706a", "created_by": "admin"}'),
('Technical specifications document', '{"title": "Tech Specs", "type": "specification", "tenant_id": "632b88da-2f15-481e-be49-613103d1706a", "created_by": "admin"}'),
('Client requirements document', '{"title": "Requirements", "type": "requirements", "tenant_id": "5396f497-c304-4b18-8f76-3e3633a4691d", "created_by": "admin"}'),
('Progress report Q1 2025', '{"title": "Q1 Report", "type": "report", "tenant_id": "5396f497-c304-4b18-8f76-3e3633a4691d", "created_by": "admin"}');