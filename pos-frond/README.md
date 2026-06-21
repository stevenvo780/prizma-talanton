# Talanton POS Frontend

Frontend React del sistema de punto de venta Talanton POS.

## Stack

- React 18 + TypeScript
- Redux Toolkit + redux-persist
- React Bootstrap + Sass
- React Router v6
- Axios (cliente HTTP)
- Firebase (autenticacion)
- driver.js (tours guiados)
- Workbox (PWA / service worker)
- react-datepicker, react-select

## Requisitos

- Node.js >= 18
- npm >= 9

## Instalacion

```bash
npm install
cp .env.example .env
# Editar .env con las variables reales
```

## Desarrollo

```bash
npm start
# Arranca en http://localhost:4002
```

## Build de produccion

```bash
npm run build
```

El build se genera en `build/` y se sirve con Nginx en Docker.

## Docker

```bash
docker build -t talanton-pos-frond .
docker run -p 4002:80 talanton-pos-frond
```

O con el docker-compose raiz de Talanton:

```bash
cd /ruta/a/Talanton
docker compose up pos-frontend -d
```

## Variables de entorno

Ver `.env.example` para la lista completa. Variables principales:

| Variable                                 | Descripcion                                       |
| ---------------------------------------- | ------------------------------------------------- |
| `REACT_APP_API_URL`                      | URL del backend POS (ej: `http://localhost:3000`) |
| `REACT_APP_FIREBASE_API_KEY`             | API key de Firebase                               |
| `REACT_APP_FIREBASE_AUTH_DOMAIN`         | Dominio auth Firebase                             |
| `REACT_APP_FIREBASE_PROJECT_ID`          | ID del proyecto Firebase                          |
| `REACT_APP_FIREBASE_STORAGE_BUCKET`      | Bucket de storage Firebase                        |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Sender ID Firebase                                |
| `REACT_APP_FIREBASE_APP_ID`              | App ID Firebase                                   |

## Estructura de vistas

```
src/views/
  Clients/      # Gestion de clientes
  Invoice/      # Facturacion
  Login/        # Autenticacion
  POSview/      # Vista principal del POS
  Products/     # Catalogo de productos
  Profile/      # Perfil de usuario
  Register/     # Registro
  Settings/     # Configuracion
  Subscribe/    # Suscripciones
```

## Proyectos relacionados

- **Backend**: `Talanton/pos` (NestJS, puerto 3000)
- **Robot**: `Talanton/robotPos` (Express, puerto 3005)
- **Orquestacion**: `Talanton/docker-compose.yml`
