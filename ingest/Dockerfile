
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose syslog ports for UDP and TCP
EXPOSE 514/udp
EXPOSE 514/tcp

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "src/index.js"]
