-- Enable RLS on tables that don't have it
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for these tables
CREATE POLICY "Allow authenticated access to compliance_violations" ON compliance_violations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to document_exports" ON document_exports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to compliance_rules" ON compliance_rules FOR SELECT USING (true);
CREATE POLICY "Allow read access to document_templates" ON document_templates FOR SELECT USING (true);
CREATE POLICY "Allow read access to jurisdictions" ON jurisdictions FOR SELECT USING (true);