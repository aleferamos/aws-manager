#!/usr/bin/env bash
set -euo pipefail

export POSTGRES_DB="${POSTGRES_DB:-aws_manager}"
export POSTGRES_USER="${POSTGRES_USER:-aws_manager}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-aws_manager_dev}"
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-5432}"
export DB_USERNAME="${DB_USERNAME:-$POSTGRES_USER}"
export DB_PASSWORD="${DB_PASSWORD:-$POSTGRES_PASSWORD}"
export DB_DATABASE="${DB_DATABASE:-$POSTGRES_DB}"
export PORT="${PORT:-3000}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:4501,http://localhost}"
export FRONTEND_SITE_URL="${FRONTEND_SITE_URL:-http://localhost:4501}"
export FRONTEND_PASSWORD_DEFINITION_URL="${FRONTEND_PASSWORD_DEFINITION_URL:-http://localhost:4501/set-password}"
export CREDENTIAL_ENCRYPTION_KEY="${CREDENTIAL_ENCRYPTION_KEY:-aws-manager-dev-key}"
export EMAIL_HOST="${EMAIL_HOST:-smtp-relay.brevo.com}"
export EMAIL_PORT="${EMAIL_PORT:-587}"
export EMAIL_FROM_EMAIL="${EMAIL_FROM_EMAIL:-}"
export EMAIL_FROM_NAME="${EMAIL_FROM_NAME:-AWS Manager}"

mkdir -p /run/nginx /var/log/nginx

docker-entrypoint.sh postgres &
postgres_pid=$!

cleanup() {
  kill -TERM "${nginx_pid:-}" "${api_pid:-}" "$postgres_pid" 2>/dev/null || true
  wait "${nginx_pid:-}" "${api_pid:-}" "$postgres_pid" 2>/dev/null || true
}

trap cleanup SIGINT SIGTERM

for _ in $(seq 1 60); do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi

  sleep 1
done

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
  echo "Postgres did not become ready in time." >&2
  cleanup
  exit 1
fi

echo "Preparing database migrations..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "CREATE TABLE IF NOT EXISTS public.schema_migrations (version text PRIMARY KEY, applied_at timestamp DEFAULT now() NOT NULL);"

for migration_file in /opt/aws-manager/db/migrations/*.sql; do
  [ -e "$migration_file" ] || continue

  migration_version="$(basename "$migration_file")"
  migration_version="${migration_version%.sql}"
  migration_applied="$(
    PGPASSWORD="$POSTGRES_PASSWORD" psql -tAc "SELECT 1 FROM public.schema_migrations WHERE version = '$migration_version'" -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  )"

  if [ "$migration_applied" = "1" ]; then
    echo "Skipping already applied migration: $migration_version"
    continue
  fi

  echo "Applying migration: $migration_version"
  PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$migration_file"
  PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "INSERT INTO public.schema_migrations (version) VALUES ('$migration_version') ON CONFLICT (version) DO NOTHING;"
done

node /opt/aws-manager/api/dist/main.js &
api_pid=$!

nginx -g "daemon off;" &
nginx_pid=$!

wait -n "$postgres_pid" "$api_pid" "$nginx_pid"
exit_code=$?
cleanup
exit "$exit_code"
