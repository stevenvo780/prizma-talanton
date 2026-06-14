# Sinergia POS

Sistema POS del ecosistema Humanizar con backend, frontend y servicio robot.

## Componentes

- `pos`: API NestJS + TypeORM + PostgreSQL.
- `pos-frond`: frontend React.
- `robotPos`: servicio Express para automatizaciones operativas.

## Infraestructura local

`docker-compose.yml` levanta:
- `pos-backend`: `3000:3000`
- `pos-frontend`: `4002:80`
- `pos-robot`: `3005:3005`
- `pos-database` (PostgreSQL): `5432:5432`
- `pos-redis` (cache): `6379:6379`

## Arranque rapido

```bash
cd Sinergia
docker compose up --build
```

## Ejecucion por componente

```bash
cd pos && npm install && npm run start:dev
cd ../pos-frond && npm install && npm start
cd ../robotPos && npm install && node index.js
```

## Referencias

- API POS: `pos/README.md`
- Rutas de usuario y endpoints: `DOCUMENTACION_RUTAS_USUARIO.md`
- Docs de facturacion DIAN y Mailjet: `pos/docs/`
