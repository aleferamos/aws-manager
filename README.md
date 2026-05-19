# AWS Manager

Instalacao basica com Docker Compose para subir Postgres, API NestJS e Web Angular.

## Requisitos

- Docker Desktop instalado e aberto.

## Subir o projeto

Crie o arquivo `.env` a partir do exemplo e preencha as configuracoes de e-mail:

```powershell
copy .env.example .env
```

Se nao configurar o e-mail, a aplicacao ainda sobe, mas acoes que enviam e-mail exibirao aviso de configuracao ausente.

```powershell
docker compose --env-file .env up --build
```

Depois acesse:

- Web: http://localhost:4501
- API: http://localhost:4500
- Postgres: localhost:4502

O banco e inicializado automaticamente na primeira subida usando o script `docker/postgres/init.sql`.

## Versao oficial mais recente

A versao oficial mais recente esta disponivel em uma imagem Docker all-in-one, com Web, API e Postgres no mesmo container.
Use um volume para manter os dados do banco entre atualizacoes e um arquivo `.env` para configurar o envio de e-mail.
O arquivo `.env` deve existir no diretorio onde voce executar o comando `docker run`.

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Depois preencha:

```env
EMAIL_HOST=smtp.seu-provedor.com
EMAIL_PORT=587
EMAIL_USER=seu-usuario-smtp
EMAIL_APP_PASSWORD=sua-chave-smtp
EMAIL_FROM_EMAIL=seu-remetente-verificado
EMAIL_FROM_NAME=AWS Manager
```

Para subir:

```bash
docker volume create aws_manager_data

docker run -d \
  --name aws-manager \
  -p 4501:80 \
  -v aws_manager_data:/var/lib/postgresql/data \
  --env-file .env \
  alefepdias/aws-manager:latest
```

Ao subir uma versao nova usando o mesmo volume, a imagem aplica automaticamente as migracoes em `Docker/postgres/migrations` que ainda nao foram registradas na tabela `schema_migrations`.
Para cada release com mudanca de banco, crie um novo arquivo sequencial, por exemplo `002_1_2_0.sql`.

## E-mail

O envio de e-mail usa variaveis de ambiente e nenhum segredo deve ficar salvo no repositorio.

Se quiser habilitar envio de e-mail, copie o exemplo:

```powershell
copy .env.example .env
```

Depois preencha `EMAIL_USER`, `EMAIL_APP_PASSWORD` e `EMAIL_FROM_EMAIL` no arquivo `.env`.
Com Docker Compose, o mesmo comando de desenvolvimento ja carrega as credenciais automaticamente:

```powershell
docker compose --env-file .env up --build
```

Com a imagem unica, use o `--env-file .env`:

```bash
docker run -d \
  --name aws-manager \
  -p 4501:80 \
  -v aws_manager_data:/var/lib/postgresql/data \
  --env-file .env \
  alefepdias/aws-manager:latest
```

## Resetar o banco

O dump so roda quando o volume do Postgres esta vazio. Para apagar os dados locais e recriar do zero:

```powershell
docker compose down -v
docker compose up --build
```

## Rodar em desenvolvimento sem Docker para API/Web

Se quiser usar Docker apenas para o banco:

```powershell
docker compose up postgres
```

Depois rode a API e o Web nas respectivas pastas:

```powershell
cd Api
npm install
copy .env.example .env
npm run start:dev
```

```powershell
cd Web
npm install
npm run start
```
