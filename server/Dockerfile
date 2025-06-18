# Use Node.js base image
FROM node:20

# Set working directory in container
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the server port
EXPOSE 3000

# Run the app
CMD ["node", "app.js"]
