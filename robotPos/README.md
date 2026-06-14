# Sinergia RobotPos

Servicio auxiliar Express para automatizaciones del ecosistema Sinergia POS.

## Stack

- Node.js
- Express

## Ejecucion

```bash
npm install
node index.js
```

## Docker

- `Dockerfile` basado en `node:20-alpine`
- Puerto expuesto: `3005`
- Integrado en `Sinergia/docker-compose.yml` como `pos-robot`
