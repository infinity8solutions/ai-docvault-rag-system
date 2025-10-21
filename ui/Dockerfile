FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

EXPOSE 3001

ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

CMD ["npm", "start"]
