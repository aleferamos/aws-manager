INSERT INTO public.authority (code, name, description, scope, created_at)
VALUES (
    'AWS_SECURITY_GROUP_EDIT_RULE',
    'Aws security group edit rule',
    'Permite editar tipo, origem e descricao de regras inbound em grupos de seguranca da conta AWS vinculada a credencial.',
    'CREDENTIAL',
    now()
)
ON CONFLICT (code) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    scope = EXCLUDED.scope;

SELECT setval(
    pg_get_serial_sequence('public.authority', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.authority), 1),
    true
)
WHERE pg_get_serial_sequence('public.authority', 'id') IS NOT NULL;
