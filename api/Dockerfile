FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

EXPOSE 5001

CMD ["npm", "run", "dev"]
