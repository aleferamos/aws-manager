CREATE TABLE IF NOT EXISTS public.app_configuration (
    id bigserial NOT NULL,
    json_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT app_configuration_pkey PRIMARY KEY (id)
);

ALTER TABLE public.app_configuration ADD COLUMN IF NOT EXISTS json_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.app_configuration ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE public.app_configuration ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
            AND table_name = 'app_configuration'
            AND column_name = 'site_url'
    ) THEN
        EXECUTE '
            UPDATE public.app_configuration
            SET json_config = jsonb_set(
                COALESCE(json_config, ''{}''::jsonb),
                ''{site_url}'',
                to_jsonb(site_url)
            )
            WHERE site_url IS NOT NULL
                AND COALESCE(json_config->>''site_url'', '''') = ''''
        ';
    END IF;
END $$;

UPDATE public.app_configuration SET json_config = '{}'::jsonb WHERE json_config IS NULL;
UPDATE public.app_configuration SET created_at = now() WHERE created_at IS NULL;
UPDATE public.app_configuration SET updated_at = now() WHERE updated_at IS NULL;

ALTER TABLE public.app_configuration ALTER COLUMN json_config SET DEFAULT '{}'::jsonb;
ALTER TABLE public.app_configuration ALTER COLUMN json_config SET NOT NULL;
ALTER TABLE public.app_configuration ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.app_configuration ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.app_configuration ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.app_configuration ALTER COLUMN updated_at SET NOT NULL;

INSERT INTO public.app_configuration (id, json_config, created_at, updated_at)
VALUES (1, '{"site_url":"http://localhost:4501"}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF to_regclass('public.credential') IS NOT NULL THEN
        ALTER TABLE public.credential ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
        UPDATE public.credential SET active = true WHERE active IS NULL;
        ALTER TABLE public.credential ALTER COLUMN active SET DEFAULT true;
        ALTER TABLE public.credential ALTER COLUMN active SET NOT NULL;

        ALTER TABLE public.credential ADD COLUMN IF NOT EXISTS created_by_user_id bigint;
        ALTER TABLE public.credential ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
        UPDATE public.credential SET created_at = now() WHERE created_at IS NULL;
        ALTER TABLE public.credential ALTER COLUMN created_at SET DEFAULT now();
        ALTER TABLE public.credential ALTER COLUMN created_at SET NOT NULL;

        ALTER TABLE public.credential ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
        UPDATE public.credential SET updated_at = now() WHERE updated_at IS NULL;
        ALTER TABLE public.credential ALTER COLUMN updated_at SET DEFAULT now();
        ALTER TABLE public.credential ALTER COLUMN updated_at SET NOT NULL;

        ALTER TABLE public.credential ADD COLUMN IF NOT EXISTS encrypted_file text;

        IF to_regclass('public.user') IS NOT NULL
            AND NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'credential_created_by_user_id_fkey'
                    AND conrelid = 'public.credential'::regclass
            )
        THEN
            ALTER TABLE public.credential
                ADD CONSTRAINT credential_created_by_user_id_fkey
                FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);
        END IF;
    END IF;
END $$;

INSERT INTO public.authority (code, name, description, scope, created_at)
VALUES
    ('AWS_INVOICE', 'Aws Invoice', 'Permite consultar custos, cobrancas e dados de billing da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_EC2_LIST', 'Aws ec2 list', 'Permite visualizar instancias EC2 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_SECURITY_GROUP_LIST', 'Aws security group list', 'Permite listar grupos de seguranca da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_SECURITY_GROUP_ADD_RULE', 'Aws security group add rule', 'Permite cadastrar regras inbound em grupos de seguranca da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_SECURITY_GROUP_DELETE_RULE', 'Aws security group delete rule', 'Permite excluir regras inbound de grupos de seguranca da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_LIST', 'Aws s3 list', 'Permite listar buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_CREATE_BUCKET', 'Aws s3 create bucket', 'Permite criar buckets S3 na conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_EMPTY_BUCKET', 'Aws s3 empty bucket', 'Permite esvaziar objetos e versoes de buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_DELETE_BUCKET', 'Aws s3 delete bucket', 'Permite excluir buckets S3 vazios da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_OBJECT_LIST', 'Aws s3 object list', 'Permite listar objetos dentro de buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_OBJECT_PUT', 'Aws s3 object put', 'Permite inserir e atualizar objetos dentro de buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_OBJECT_DELETE', 'Aws s3 object delete', 'Permite excluir objetos selecionados dentro de buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_OBJECT_DOWNLOAD', 'Aws s3 object download', 'Permite baixar objetos selecionados dentro de buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now()),
    ('AWS_S3_OBJECT_RENAME', 'Aws s3 object rename', 'Permite renomear objetos e prefixos dentro de buckets S3 da conta AWS vinculada a credencial.', 'CREDENTIAL', now())
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    scope = EXCLUDED.scope;

SELECT setval(
    pg_get_serial_sequence('public.authority', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.authority), 1),
    true
)
WHERE pg_get_serial_sequence('public.authority', 'id') IS NOT NULL;
