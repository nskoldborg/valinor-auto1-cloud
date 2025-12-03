# shared/frontend/Dockerfile

# ============================================================
# Stage 1: Builder - Install Node Dependencies and Build Assets
# ============================================================
FROM node:20-alpine as builder
WORKDIR /app

# Install Vite, Tailwind, and other dependencies
COPY package.json package-lock.json tailwind.config.js vite.config.js ./
RUN npm install

# Copy source code (src/, public/, etc.)
COPY . .

# Build the final static files
RUN npm run build 

# ============================================================
# Stage 2: Final Image - Serve Static Files via Nginx
# ============================================================
FROM nginx:alpine
EXPOSE 80

# Remove the default Nginx index.html
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage into Nginx's serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# CRITICAL: Copy the custom nginx.conf file
# The context is 'shared/frontend', so the path is 'nginx/nginx.conf'
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Nginx starts automatically as CMD.