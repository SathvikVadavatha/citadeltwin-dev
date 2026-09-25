-- document_variables (created in 20250615173527-9f0ed772-34f7-429e-ac1e-234ad5c288b7.sql)
-- has no application-code references anywhere in src/ or in either document-generation
-- edge function (generate-document, generate-advanced-document), and no other table has
-- a foreign key pointing to it — it is a fully orphaned leaf table. Recommended for
-- removal as dead schema. NOT applied automatically — review and run when ready.

DROP TABLE IF EXISTS public.document_variables;
