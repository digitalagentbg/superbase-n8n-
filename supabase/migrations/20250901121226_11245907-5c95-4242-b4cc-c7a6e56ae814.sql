-- Create sample data for testing the dashboard
INSERT INTO public.executions (
  tenant_id, 
  workflow_id, 
  workflow_name, 
  status, 
  timestamp, 
  duration_ms, 
  trigger_type,
  cost_usd,
  input_bytes,
  output_bytes
) VALUES 
-- Data for Client A tenant
('632b88da-2f15-481e-be49-613103d1706a', 'wf_001', 'Обработка на данни', 'success', NOW() - INTERVAL '1 hour', 2500, 'manual', 0.05, 1024, 2048),
('632b88da-2f15-481e-be49-613103d1706a', 'wf_002', 'Синхронизация', 'success', NOW() - INTERVAL '2 hours', 1800, 'scheduled', 0.03, 512, 1024),
('632b88da-2f15-481e-be49-613103d1706a', 'wf_003', 'Експорт отчети', 'error', NOW() - INTERVAL '3 hours', 500, 'manual', 0.01, 256, 0),
('632b88da-2f15-481e-be49-613103d1706a', 'wf_004', 'Обработка файлове', 'success', NOW() - INTERVAL '1 day', 3200, 'webhook', 0.08, 4096, 8192),
('632b88da-2f15-481e-be49-613103d1706a', 'wf_005', 'Валидация данни', 'success', NOW() - INTERVAL '2 days', 1200, 'scheduled', 0.02, 800, 600),

-- Data for Client B tenant  
('5396f497-c304-4b18-8f76-3e3633a4691d', 'wf_011', 'Импорт данни', 'success', NOW() - INTERVAL '30 minutes', 4500, 'manual', 0.12, 8192, 16384),
('5396f497-c304-4b18-8f76-3e3633a4691d', 'wf_012', 'Анализ тенденции', 'success', NOW() - INTERVAL '4 hours', 6800, 'scheduled', 0.15, 2048, 4096),
('5396f497-c304-4b18-8f76-3e3633a4691d', 'wf_013', 'Генериране отчети', 'error', NOW() - INTERVAL '5 hours', 800, 'webhook', 0.02, 1024, 0),
('5396f497-c304-4b18-8f76-3e3633a4691d', 'wf_014', 'Почистване данни', 'success', NOW() - INTERVAL '1 day', 2100, 'manual', 0.05, 1536, 1024);