FROM node:22-alpine

WORKDIR /app

# Avendo impostato la Base Directory su /backend, 
# qui siamo già "dentro" la cartella backend.
COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# The app listens on PORT env var (fallback 3000)
EXPOSE 3000

CMD ["npm", "start"]
