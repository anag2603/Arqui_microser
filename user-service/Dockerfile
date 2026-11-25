FROM node:20-slim
WORKDIR /app

# Dependencias de shared
COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev

# Dependencias del servicio
COPY user-service/package*.json ./user-service/
RUN cd user-service && npm ci --omit=dev

# Código
COPY shared ./shared
COPY user-service ./user-service

WORKDIR /app/user-service
CMD ["node", "src/index.js"]
