# Stage 1: Build/Deps
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
# Use non-privileged node user
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 4001
CMD ["node", "src/index.js"]
