# Dockerfile para Robot Service
FROM node:20-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3005

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
