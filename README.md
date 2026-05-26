# AWS Manager

Basic Docker Compose setup to run Postgres, the NestJS API, and the Angular Web app.

## Requirements

- Docker Desktop installed and running.

## Run The Project

Create a `.env` file from the example and fill in the e-mail settings:

```powershell
copy .env.example .env
```

If e-mail is not configured, the application still starts, but actions that send e-mails will show a missing configuration warning.

```powershell
docker compose --env-file .env up --build
```

Then open:

- Web: http://localhost:4501
- API: http://localhost:4500
- Postgres: localhost:4502

The database is initialized automatically on the first run using `docker/postgres/init.sql`.

## Latest Official Version

The latest official version is available as an all-in-one Docker image with Web, API, and Postgres in the same container.
Use a volume to keep database data between updates and a `.env` file to configure e-mail delivery.
The `.env` file must exist in the directory where you run `docker run`.

Create the `.env` file from the example:

```bash
cp .env.example .env
```

Then fill in:

```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-user
EMAIL_APP_PASSWORD=your-smtp-key
EMAIL_FROM_EMAIL=your-verified-sender
EMAIL_FROM_NAME=AWS Manager
```

Run the container:

```bash
docker volume create aws_manager_data

docker run -d \
  --name aws-manager \
  -p 4501:80 \
  -v aws_manager_data:/var/lib/postgresql/data \
  --env-file .env \
  alefepdias/aws-manager:latest
```

When running a new version with the same volume, the image automatically applies migrations from `Docker/postgres/migrations` that have not been registered in the `schema_migrations` table yet.
For each release with database changes, create a new sequential file, for example `002_1_2_0.sql`.

## E-mail

E-mail delivery uses environment variables, and no secret should be stored in the repository.

To enable e-mail delivery, copy the example file:

```powershell
copy .env.example .env
```

Then fill in `EMAIL_USER`, `EMAIL_APP_PASSWORD`, and `EMAIL_FROM_EMAIL` in the `.env` file.
With Docker Compose, the development command already loads the credentials automatically:

```powershell
docker compose --env-file .env up --build
```

With the all-in-one image, use `--env-file .env`:

```bash
docker run -d \
  --name aws-manager \
  -p 4501:80 \
  -v aws_manager_data:/var/lib/postgresql/data \
  --env-file .env \
  alefepdias/aws-manager:latest
```

## Reset The Database

The dump only runs when the Postgres volume is empty. To delete local data and recreate the database from scratch:

```powershell
docker compose down -v
docker compose up --build
```

## Run API/Web Locally Without Docker

If you want to use Docker only for the database:

```powershell
docker compose up postgres
```

Then run the API and Web app from their folders:

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
