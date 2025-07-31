# Use official Node.js Alpine image as base
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Build assets (if any) - optional step, not needed here
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define environment variable for production
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
