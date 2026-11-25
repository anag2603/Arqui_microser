FROM node:20-slim
WORKDIR /app

# Dependencias de shared
COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev

# Dependencias del servicio
COPY auth-service/package*.json ./auth-service/
RUN cd auth-service && npm ci --omit=dev

# Código
COPY shared ./shared
COPY auth-service ./auth-service

WORKDIR /app/auth-service
CMD ["node", "src/index.js"]
