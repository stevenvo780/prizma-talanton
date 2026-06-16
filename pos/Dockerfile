# Multi-stage build para NestJS
FROM node:20-alpine AS build

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (incluidas dev)
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar build desde la etapa anterior
COPY --from=build /app/dist ./dist

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Cambiar propiedad de archivos
RUN chown -R nestjs:nodejs /app
USER nestjs

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"]
