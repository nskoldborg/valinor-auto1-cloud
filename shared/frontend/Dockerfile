# shared/frontend/Dockerfile

# ============================================================
# Stage 1: Builder - Install Node Dependencies and Build Assets
# ============================================================
FROM node:20-slim as builder
WORKDIR /app

# Install Vite, Tailwind, and other dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and config (vite.config.js, tailwind.config.js, src/)
COPY . .

# Build the final static files (output usually goes to a 'dist' folder)
RUN npm run build 

# ============================================================
# Stage 2: Final Image - Serve Static Files (smallest image)
# ============================================================
# Use a lightweight server like Nginx to serve the static files
FROM nginx:alpine
EXPOSE 80

# Copy the built assets from the builder stage into Nginx's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config if needed, otherwise uses default
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx starts automatically as CMD, serving the static site.