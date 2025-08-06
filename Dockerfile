FROM node:22-alpine

# Instalar bash y dependencias necesarias
RUN apk add --no-cache bash

# Crear carpeta de la app
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Instalar Vite globalmente
RUN npm install -g vite

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto de desarrollo
EXPOSE 5173

# Comando por defecto: levantar el servidor
CMD ["npm", "run", "dev", "--", "--host"]
