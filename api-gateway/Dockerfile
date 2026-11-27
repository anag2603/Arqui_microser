FROM node:20-slim
WORKDIR /app

# Dependencias de shared
COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev

# Dependencias del servicio
COPY api-gateway/package*.json ./api-gateway/
RUN cd api-gateway && npm ci --omit=dev

# Código y documentación Swagger
COPY shared ./shared
COPY api-gateway ./api-gateway
COPY docs ./docs

WORKDIR /app/api-gateway
CMD ["node", "src/index.js"]
