-- Enable RLS on remaining tables without policies
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for these tables
CREATE POLICY "Users can access compliance_checks" ON compliance_checks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read document_variables" ON document_variables FOR SELECT USING (true);
CREATE POLICY "Users can read jurisdiction_codes" ON jurisdiction_codes FOR SELECT USING (true);
CREATE POLICY "Users can read roles" ON roles FOR SELECT USING (true);