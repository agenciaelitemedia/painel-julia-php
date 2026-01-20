-- Create bucket for contract templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-templates', 'contract-templates', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow upload contract templates
CREATE POLICY "Allow upload contract templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contract-templates');

-- Policy to allow read contract templates  
CREATE POLICY "Allow read contract templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'contract-templates');

-- Policy to allow delete contract templates
CREATE POLICY "Allow delete contract templates" ON storage.objects
  FOR DELETE USING (bucket_id = 'contract-templates');