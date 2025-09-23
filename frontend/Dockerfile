# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install --production=false

# Copy source code
COPY . .

# Build app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]