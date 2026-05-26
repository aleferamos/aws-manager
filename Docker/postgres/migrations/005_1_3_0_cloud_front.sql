INSERT INTO public.authority (code, name, description, scope, created_at)
VALUES
    ('AWS_CLOUDFRONT_LIST_DISTRIBUTIONS', 'Aws cloudfront list distributions', 'Permite listar distribuicoes CloudFront da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_CLOUDFRONT_LIST_INVALIDATIONS', 'Aws cloudfront list invalidations', 'Permite listar invalidations de distribuicoes CloudFront da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_CLOUDFRONT_CREATE_INVALIDATION', 'Aws cloudfront create invalidation', 'Permite criar invalidations em distribuicoes CloudFront da conta AWS vinculada a credencial.', 'CREDENTIAL', now())
ON CONFLICT (code) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('public.authority', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.authority), 1),
    true
)
WHERE pg_get_serial_sequence('public.authority', 'id') IS NOT NULL;
