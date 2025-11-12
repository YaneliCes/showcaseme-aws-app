# Use the latest LTS version of Node.js
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Expose the port the server runs on
EXPOSE 3000

# Run command
CMD ["node", "server.js"]
