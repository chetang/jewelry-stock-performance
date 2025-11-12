# ============================================
# Stage 1: Base Ruby image for Rails
# ============================================
ARG RUBY_VERSION=3.4.7
FROM ruby:${RUBY_VERSION}-bookworm AS ruby-base

# OS packages for building native gems (pg, etc.)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    build-essential libpq-dev git curl ca-certificates tzdata \
 && rm -rf /var/lib/apt/lists/*

# Bundler config
ENV BUNDLE_WITHOUT="production"
RUN gem install bundler:2.4.1

WORKDIR /app

# ============================================
# Stage 2: Rails Development
# ============================================
FROM ruby-base AS backend

# Cache gems
COPY Gemfile Gemfile.lock ./
RUN bundle install

# App code
COPY . .

# Rails default port (your compose maps 3001 externally)
EXPOSE 3000

# Default command (compose overrides with its own command)
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]

# ============================================
# Stage 3: Node.js Base (for Next.js dev)
# ============================================
FROM node:20-bookworm-slim AS node-base
WORKDIR /app

# ============================================
# Stage 4: Next.js Development
# ============================================
FROM node-base AS frontend

# Cache node modules
COPY package*.json ./
RUN npm ci

# App code
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# # ============================================
# # Stage 3: Rails Production Builder
# # ============================================
# FROM ruby-base AS rails-builder

# COPY Gemfile Gemfile.lock ./
# RUN bundle install --jobs 4 --retry 3 --without development test

# COPY . .

# # ============================================
# # Stage 4: Rails Production
# # ============================================
# FROM ruby:${RUBY_VERSION}-bookworm AS backend-production

# RUN apk add --no-cache \
#     postgresql-client \
#     tzdata \
#     curl

# WORKDIR /app

# COPY --from=rails-builder /usr/local/bundle /usr/local/bundle
# COPY --from=rails-builder /app /app

# EXPOSE 3000

# CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]

# # ============================================
# # Stage 5: Node.js Base
# # ============================================
# FROM node:20-alpine AS node-base

# WORKDIR /app

# # ============================================
# # Stage 6: Next.js Development
# # ============================================
# FROM node-base AS frontend

# COPY package*.json ./
# RUN npm install

# COPY . .

# EXPOSE 3000

# CMD ["npm", "run", "dev"]

# # ============================================
# # Stage 7: Next.js Production Builder
# # ============================================
# FROM node-base AS nextjs-builder

# COPY package*.json ./
# # RUN npm ci --only=production
# # RUN npm install --omit=dev

# COPY . .

# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# # RUN npm run build

# # ============================================
# # Stage 8: Next.js Production
# # ============================================
# FROM node:20-alpine AS frontend-production

# WORKDIR /app

# ENV NODE_ENV=production

# # COPY --from=nextjs-builder /app/package*.json ./
# # COPY --from=nextjs-builder /app/node_modules ./node_modules
# # COPY --from=nextjs-builder /app/.next ./.next
# # COPY --from=nextjs-builder /app/public ./public

# EXPOSE 3000

# CMD ["npm", "start"]

# # ============================================
# # Stage 9: Combined Production (for GCP)
# # ============================================
# FROM ruby:${RUBY_VERSION}-bookworm AS production

# RUN apk add --no-cache \
#     postgresql-client \
#     tzdata \
#     nodejs \
#     npm \
#     nginx \
#     curl

# WORKDIR /app

# COPY --from=rails-builder /usr/local/bundle /usr/local/bundle
# COPY --from=rails-builder /app /app

# # COPY --from=nextjs-builder /app/.next /app/.next
# # COPY --from=nextjs-builder /app/public /app/public
# # COPY --from=nextjs-builder /app/node_modules /app/node_modules

# COPY config/nginx.conf /etc/nginx/nginx.conf
# COPY docker-entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# EXPOSE 8080

# ENTRYPOINT ["docker-entrypoint.sh"]
