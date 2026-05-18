# AWS Manager

Instalacao basica com Docker Compose para subir Postgres, API NestJS e Web Angular.

## Requisitos

- Docker Desktop instalado e aberto.

## Subir o projeto

```powershell
docker compose up --build
```

Depois acesse:

- Web: http://localhost:4501
- API: http://localhost:4500
- Postgres: localhost:4502

O banco e inicializado automaticamente na primeira subida usando o script `docker/postgres/init.sql`.

## Imagem unica

Tambem existe uma imagem all-in-one para instalacao simples, com Web, API e Postgres no mesmo container.
Use um volume para manter os dados do banco entre atualizacoes:

```powershell
docker volume create aws_manager_data

docker run -d `
  --name aws-manager `
  -p 4501:80 `
  -v aws_manager_data:/var/lib/postgresql/data `
  alefepdias/aws-manager:1.1.0
```

Para atualizar a aplicacao mantendo os dados:

```powershell
docker stop aws-manager
docker rm aws-manager

docker run -d `
  --name aws-manager `
  -p 4501:80 `
  -v aws_manager_data:/var/lib/postgresql/data `
  alefepdias/aws-manager:1.1.0
```

Ao subir uma versao nova usando o mesmo volume, a imagem aplica automaticamente as migracoes em `Docker/postgres/migrations` que ainda nao foram registradas na tabela `schema_migrations`.
Para cada release com mudanca de banco, crie um novo arquivo sequencial, por exemplo `002_1_2_0.sql`.

Para gerar a imagem localmente:

```powershell
docker build -f Dockerfile.all-in-one -t alefepdias/aws-manager:1.1.0 .
```

Para publicar no Docker Hub:

```powershell
docker login
docker push alefepdias/aws-manager:1.1.0
docker tag alefepdias/aws-manager:1.1.0 alefepdias/aws-manager:latest
docker push alefepdias/aws-manager:latest
```

## Aviso de atualizacao

A aplicacao compara a versao local do Web com o manifesto publico:

```text
https://awsmanager.cloud/version.json
```

Formato esperado:

```json
{
  "version": "1.1.0"
}
```

Quando publicar uma nova imagem, atualize esse arquivo com a versao mais recente.
O dominio precisa permitir leitura do JSON pelo navegador das instalacoes self-hosted.

## E-mail

O envio de e-mail usa variaveis de ambiente e nenhum segredo deve ficar salvo no repositorio.

Se quiser habilitar envio de e-mail, copie o exemplo:

```powershell
copy .env.example .env
```

Depois preencha `EMAIL_USER`, `EMAIL_APP_PASSWORD` e `EMAIL_FROM_EMAIL` no arquivo `.env`.
Com isso, o mesmo comando de subida ja carrega as credenciais automaticamente:

```powershell
docker compose up --build
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
