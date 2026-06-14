# Sinergia POS API

Backend NestJS del sistema POS de Sinergia.

## Stack

- NestJS + TypeScript
- TypeORM + PostgreSQL
- Redis (cache/eventos)
- Swagger

## Requisitos

- Node.js >= 18
- PostgreSQL

## Configuracion

```bash
cp .env.example .env
```

Variables clave:
- `PORT` (si no se define, el codigo usa `4001`)
- `DATABASE_*`
- `FIREBASE_*`
- `MAILJET_*`
- `WOMPI_*`

## Ejecucion local

```bash
npm install
npm run start:dev
```

Rutas locales:
- API: `http://localhost:4001`
- Swagger: `http://localhost:4001/api`

Nota operativa:
- En `Sinergia/docker-compose.yml` el backend se ejecuta con `PORT=3000` y se publica como `3000:3000`.

## Docker (stack Sinergia)

Desde `Sinergia/`:

```bash
docker compose up --build
```

Servicios del stack:
- `pos-backend`: `3000:3000`
- `pos-frontend`: `4002:80`
- `pos-robot`: `3005:3005`
- `pos-database`: `5432:5432`
- `pos-redis`: `6379:6379`

## Scripts utiles

```bash
npm run build
npm run start:prod
npm run test
npm run lint
```

## Referencias

- Frontend: `../pos-frond/README.md`
- Robot: `../robotPos/README.md`
- Integraciones/operacion: `../DOCUMENTACION_RUTAS_USUARIO.md`
