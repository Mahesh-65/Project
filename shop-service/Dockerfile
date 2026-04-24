# Stage 1: Build/Deps
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
EXPOSE 4006
CMD ["node", "src/index.js"]
