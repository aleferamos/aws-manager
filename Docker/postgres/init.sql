--
-- PostgreSQL database dump
--

\restrict u5fBye5O2SgMXqsK0D51LhwMYIdLeEiD4gpAKZfzcS7NybgFK0g3Sl2rJOhenXe

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: authority; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.authority (
    id bigint NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255),
    scope character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: authority_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.authority_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: authority_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.authority_id_seq OWNED BY public.authority.id;


--
-- Name: credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credential (
    id bigserial NOT NULL,
    "name" varchar(120) NOT NULL,
    description varchar(255) NULL,
    active bool DEFAULT true NOT NULL,
    created_by_user_id int8 NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    encrypted_file text NOT NULL,
    CONSTRAINT credential_pkey PRIMARY KEY (id)
);


--
-- Name: app_configuration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_configuration (
    id smallint NOT NULL,
    json_config jsonb NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT app_configuration_pkey PRIMARY KEY (id)
);


--
-- Name: person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150),
    phone character varying(30),
    document character varying(30),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: person_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.person_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: person_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.person_id_seq OWNED BY public.person.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id bigint NOT NULL,
    login character varying(100) NOT NULL,
    password character varying(255),
    person_id bigint,
    type character varying(30) DEFAULT 'NORMAL'::character varying NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    last_access_at timestamp without time zone,
    password_redefinition_expires_at timestamp without time zone,
    password_redefinition_code character varying
);


--
-- Name: user_authority; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_authority (
    user_id bigint NOT NULL,
    authority_id bigint NOT NULL
);


--
-- Name: user_credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credential (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    credential_id bigint NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_credential_authority; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credential_authority (
    user_credential_id bigint NOT NULL,
    authority_id bigint NOT NULL
);


--
-- Name: user_credential_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_credential_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_credential_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_credential_id_seq OWNED BY public.user_credential.id;


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: authority id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authority ALTER COLUMN id SET DEFAULT nextval('public.authority_id_seq'::regclass);


--
-- Name: person id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person ALTER COLUMN id SET DEFAULT nextval('public.person_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: user_credential id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential ALTER COLUMN id SET DEFAULT nextval('public.user_credential_id_seq'::regclass);


--
-- Data for Name: authority; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.authority (id, code, name, description, scope, created_at) FROM stdin;
1	AWS_INVOICE	Aws Invoice	Permite consultar custos, faturas e informações de cobrança da conta AWS vinculada à credencial.	CREDENTIAL	2026-05-05 01:14:15.24309
2	AWS_EC2_LIST	Aws ec2 list	Permite visualizar e consultar instâncias EC2 disponíveis na conta AWS vinculada à credencial.	CREDENTIAL	2026-05-05 01:15:02.924664
3	AWS_SECURITY_GROUP_LIST	Aws security group list	Permite listar e consultar grupos de segurança da conta AWS vinculada à credencial.	CREDENTIAL	2026-05-05 01:15:44.725247
4	AWS_SECURITY_GROUP_ADD_RULE	Aws security group add rule	Permite adicionar regras de entrada em grupos de segurança da conta AWS vinculada à credencial.	CREDENTIAL	2026-05-05 01:16:36.943208
5	AWS_SECURITY_GROUP_DELETE_RULE	Aws security group delete rule	Permite remover regras de entrada de grupos de segurança da conta AWS vinculada à credencial.	CREDENTIAL	2026-05-05 01:17:12.686658
6	AWS_S3_LIST	Aws s3 list	Permite listar buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 14:50:00
7	AWS_S3_CREATE_BUCKET	Aws s3 create bucket	Permite criar buckets S3 na conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 14:50:00
8	AWS_S3_EMPTY_BUCKET	Aws s3 empty bucket	Permite esvaziar objetos e versoes de buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 14:50:00
9	AWS_S3_DELETE_BUCKET	Aws s3 delete bucket	Permite excluir buckets S3 vazios da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 14:50:00
10	AWS_S3_OBJECT_LIST	Aws s3 object list	Permite listar objetos dentro de buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 15:20:00
11	AWS_S3_OBJECT_PUT	Aws s3 object put	Permite inserir e atualizar objetos dentro de buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 15:20:00
12	AWS_S3_OBJECT_DELETE	Aws s3 object delete	Permite excluir objetos selecionados dentro de buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-13 15:20:00
13	AWS_S3_OBJECT_DOWNLOAD	Aws s3 object download	Permite baixar objetos selecionados dentro de buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-14 09:30:00
14	AWS_S3_OBJECT_RENAME	Aws s3 object rename	Permite renomear objetos e prefixos dentro de buckets S3 da conta AWS vinculada a credencial.	CREDENTIAL	2026-05-14 09:30:00
\.


--
-- Data for Name: credential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.credential (id, name, description, active, created_by_user_id, created_at, updated_at, encrypted_file) FROM stdin;
\.


--
-- Data for Name: app_configuration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_configuration (id, json_config, created_at, updated_at) FROM stdin;
1	{"site_url": "http://localhost:4501"}	2026-05-08 00:00:00	2026-05-08 00:00:00
\.


--
-- Data for Name: person; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.person (id, name, email, phone, document, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, login, password, person_id, type, active, created_at, updated_at, last_access_at, password_redefinition_expires_at, password_redefinition_code) FROM stdin;
1	admin		\N	ROOT	f	2026-04-29 20:22:34.342107	2026-05-05 12:18:04.580253	\N	\N	\N
\.


--
-- Data for Name: user_authority; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_authority (user_id, authority_id) FROM stdin;
\.


--
-- Data for Name: user_credential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_credential (id, user_id, credential_id, active, created_at) FROM stdin;
\.


--
-- Data for Name: user_credential_authority; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_credential_authority (user_credential_id, authority_id) FROM stdin;
\.


--
-- Name: authority_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.authority_id_seq', 14, true);


--
-- Name: credential_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.credential_id_seq', 1, false);


--
-- Name: person_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.person_id_seq', 1, false);


--
-- Name: user_credential_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_credential_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_id_seq', 1, true);


--
-- Name: authority authority_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authority
    ADD CONSTRAINT authority_code_key UNIQUE (code);


--
-- Name: authority authority_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.authority
    ADD CONSTRAINT authority_pkey PRIMARY KEY (id);


--
-- Name: person person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pkey PRIMARY KEY (id);


--
-- Name: user_authority user_authority_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_authority
    ADD CONSTRAINT user_authority_pkey PRIMARY KEY (user_id, authority_id);


--
-- Name: user_credential_authority user_credential_authority_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential_authority
    ADD CONSTRAINT user_credential_authority_pkey PRIMARY KEY (user_credential_id, authority_id);


--
-- Name: user_credential user_credential_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential
    ADD CONSTRAINT user_credential_pkey PRIMARY KEY (id);


--
-- Name: user_credential user_credential_user_id_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential
    ADD CONSTRAINT user_credential_user_id_credential_id_key UNIQUE (user_id, credential_id);


--
-- Name: user user_login_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_login_key UNIQUE (login);


--
-- Name: user user_person_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_person_id_unique UNIQUE (person_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: credential credential_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT credential_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);


--
-- Name: user_authority user_authority_authority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_authority
    ADD CONSTRAINT user_authority_authority_id_fkey FOREIGN KEY (authority_id) REFERENCES public.authority(id) ON DELETE CASCADE;


--
-- Name: user_authority user_authority_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_authority
    ADD CONSTRAINT user_authority_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_credential_authority user_credential_authority_authority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential_authority
    ADD CONSTRAINT user_credential_authority_authority_id_fkey FOREIGN KEY (authority_id) REFERENCES public.authority(id) ON DELETE CASCADE;


--
-- Name: user_credential_authority user_credential_authority_user_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential_authority
    ADD CONSTRAINT user_credential_authority_user_credential_id_fkey FOREIGN KEY (user_credential_id) REFERENCES public.user_credential(id) ON DELETE CASCADE;


--
-- Name: user_credential user_credential_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential
    ADD CONSTRAINT user_credential_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.credential(id) ON DELETE CASCADE;


--
-- Name: user_credential user_credential_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credential
    ADD CONSTRAINT user_credential_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user user_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id);


--
-- PostgreSQL database dump complete
--

\unrestrict u5fBye5O2SgMXqsK0D51LhwMYIdLeEiD4gpAKZfzcS7NybgFK0g3Sl2rJOhenXe
