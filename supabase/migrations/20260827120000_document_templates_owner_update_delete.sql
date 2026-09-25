-- document_templates has RLS enabled (see 20250806194259_a45964c8-236b-454e-8b75-5a7545fc43b1.sql)
-- but only ever got a SELECT policy. There is no UPDATE or DELETE policy, so the
-- template Edit/Delete actions in the Documents UI would be rejected by RLS with
-- no visible policy allowing either operation. Add owner-scoped policies so a user
-- can only update/delete templates they created themselves (created_by = auth.uid()).
-- Templates with created_by IS NULL (the seed rows from 20250615173527...sql) are not
-- owned by any user and intentionally remain un-editable/un-deletable through this policy.

CREATE POLICY "Users can update their own document_templates"
ON public.document_templates
FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own document_templates"
ON public.document_templates
FOR DELETE
USING (created_by = auth.uid());
