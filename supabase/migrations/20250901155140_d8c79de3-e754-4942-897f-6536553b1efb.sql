-- Update the project to use n8n_chat_histories table
UPDATE project 
SET data_table = 'n8n_chat_histories' 
WHERE id = '482770fe-6c74-40d0-9675-07f501a25ba1';