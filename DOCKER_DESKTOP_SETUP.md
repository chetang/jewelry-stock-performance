# Running on Docker Desktop

This guide will help you run the Jewelry Stock Performance application on Docker Desktop for local development.

## Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - macOS: Docker Desktop for Mac
   - Windows: Docker Desktop for Windows (with WSL2 enabled)
   - Linux: Docker Engine + Docker Compose

2. **Verify Installation**
   \`\`\`bash
   docker --version
   docker-compose --version
   \`\`\`

3. **Configure Docker Desktop Resources**
   - Open Docker Desktop Settings
   - Resources → Advanced
   - Recommended: 4 CPUs, 8GB RAM, 2GB Swap
   - Elasticsearch needs at least 2GB of RAM

## Quick Start

### 1. Clone and Setup

\`\`\`bash
# Navigate to project directory
cd jewelry-stock-performance

# Copy environment file
cp .env.example .env
\`\`\`

### 2. Build and Start Services

\`\`\`bash
# Build all services (first time only)
docker-compose build

# Start all services
docker-compose up
\`\`\`

This will start:
- PostgreSQL (port 5432)
- Elasticsearch (port 9200)
- Redis (port 6379)
- Rails Backend (port 3001)
- Sidekiq (background jobs)
- Next.js Frontend (port 3000)

### 3. Setup Database (First Time Only)

Open a new terminal and run:

\`\`\`bash
# Create database
docker-compose exec backend rails db:create

# Run migrations
docker-compose exec backend rails db:migrate

# Seed initial data (optional)
docker-compose exec backend rails db:seed

# Setup Elasticsearch indices
docker-compose exec backend rails elasticsearch:setup
\`\`\`

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Elasticsearch**: http://localhost:9200
- **Sidekiq Web UI**: http://localhost:3001/sidekiq (if configured)

## Common Commands

### Start Services
\`\`\`bash
# Start all services
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Start specific service
docker-compose up backend
\`\`\`

### Stop Services
\`\`\`bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
\`\`\`

### View Logs
\`\`\`bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f sidekiq
\`\`\`

### Execute Commands
\`\`\`bash
# Rails console
docker-compose exec backend rails console

# Run migrations
docker-compose exec backend rails db:migrate

# Bundle install (after Gemfile changes)
docker-compose exec backend bundle install

# NPM install (after package.json changes)
docker-compose exec frontend npm install

# Run tests
docker-compose exec backend rspec
\`\`\`

### Database Operations
\`\`\`bash
# Create database
docker-compose exec backend rails db:create

# Drop database
docker-compose exec backend rails db:drop

# Reset database (drop, create, migrate, seed)
docker-compose exec backend rails db:reset

# Backup database
docker-compose exec postgres pg_dump -U jewelry_user jewelry_development > backup.sql

# Restore database
docker-compose exec -T postgres psql -U jewelry_user jewelry_development < backup.sql
\`\`\`

### Elasticsearch Operations
\`\`\`bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# List indices
curl http://localhost:9200/_cat/indices?v

# Reindex jewelry data
docker-compose exec backend rails elasticsearch:reindex
\`\`\`

## Development Workflow

### Making Code Changes

The docker-compose.yml uses volume mounts, so code changes are reflected immediately:

**Backend (Rails):**
- Code changes are auto-reloaded
- After Gemfile changes: `docker-compose exec backend bundle install`
- After migrations: `docker-compose exec backend rails db:migrate`

**Frontend (Next.js):**
- Code changes trigger hot reload automatically
- After package.json changes: `docker-compose exec frontend npm install`

### Rebuilding After Major Changes

\`\`\`bash
# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild all services
docker-compose build

# Rebuild without cache
docker-compose build --no-cache
\`\`\`

## Troubleshooting

### Services Won't Start

**Check Docker Desktop is running:**
\`\`\`bash
docker ps
\`\`\`

**Check port conflicts:**
\`\`\`bash
# macOS/Linux
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Windows
netstat -ano | findstr :3000
\`\`\`

**View service status:**
\`\`\`bash
docker-compose ps
\`\`\`

### Elasticsearch Memory Issues

If Elasticsearch fails to start:

\`\`\`bash
# On Linux, increase vm.max_map_count
sudo sysctl -w vm.max_map_count=262144

# Make it permanent
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
\`\`\`

On Docker Desktop for Mac/Windows, this is usually handled automatically.

### Database Connection Issues

\`\`\`bash
# Check if Postgres is ready
docker-compose exec postgres pg_isready -U jewelry_user

# Check database exists
docker-compose exec postgres psql -U jewelry_user -l
\`\`\`

### Reset Everything

\`\`\`bash
# Stop all services and remove volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up

# Setup database again
docker-compose exec backend rails db:create db:migrate db:seed
\`\`\`

### Performance Issues

1. **Increase Docker Resources** (Docker Desktop Settings)
   - CPUs: 4-6
   - Memory: 8-12 GB
   
2. **Use Native File System** (Mac only)
   - Enable "VirtioFS" in Docker Desktop Settings → Experimental Features

3. **Prune Docker System**
   \`\`\`bash
   docker system prune -a
   \`\`\`

## Production Build Testing

Test the production build locally:

\`\`\`bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production stack
docker-compose -f docker-compose.prod.yml up
\`\`\`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Rails with Docker Guide](https://docs.docker.com/samples/rails/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)

## Support

For issues specific to:
- **Docker**: Check Docker Desktop logs and GitHub issues
- **Application**: Refer to SETUP.md and DEPLOYMENT.md
- **Database**: Check postgres logs with `docker-compose logs postgres`
