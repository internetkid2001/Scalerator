# Docker Deployment Guide for Scalerator

## Overview
This guide covers deploying Scalerator using Docker containers, both locally and on Unraid via GitHub Container Registry (GHCR).

## Quick Start - Local Development

```bash
# Build and run locally
docker-compose up --build

# Or run manually
docker build -t scalerator .
docker run -p 3002:3000 scalerator
```

Access the application at `http://localhost:3002`

## GitHub Container Registry (GHCR) Deployment

### Automatic Builds
Every push to `master`/`main` automatically builds and pushes to GHCR via GitHub Actions.

### Manual Build and Push
```bash
# Build for GHCR
docker build -t ghcr.io/YOUR_USERNAME/scalerator-main:latest .

# Login to GHCR (use GitHub Personal Access Token)
echo "YOUR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Push to registry
docker push ghcr.io/YOUR_USERNAME/scalerator-main:latest
```

## Unraid Deployment

### 1. Container Configuration
- **Name**: `scalerator`
- **Repository**: `ghcr.io/YOUR_USERNAME/scalerator-main:latest`
- **Network Type**: `bridge`
- **Console shell command**: `bash`

### 2. Port Mapping
- **Host Port**: `3002` → **Container Port**: `3000`

### 3. Environment Variables (Optional)
- `NODE_ENV`: `production`

### 4. Additional Settings
- **Restart Policy**: `unless-stopped`
- **Privileged**: `No`

### 5. Health Check
The container includes built-in health checks that verify the application is responding properly.

## Image Details

### Multi-stage Build
- **Builder stage**: Installs dependencies and builds the Next.js application
- **Production stage**: Runs the optimized standalone build with minimal footprint

### Security Features
- Runs as non-root user (`nextjs:nodejs`)
- Uses Alpine Linux base for smaller attack surface
- Includes health checks for monitoring

### Supported Architectures
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, including Apple Silicon and Raspberry Pi)

## Updating the Container

### Via Unraid
1. Go to Docker tab
2. Click container name or edit icon
3. Change tag to new version (e.g., `:v1.0.1`)
4. Click **Apply**

### Manual Update
```bash
# Pull latest image
docker pull ghcr.io/YOUR_USERNAME/scalerator-main:latest

# Stop and remove old container
docker stop scalerator && docker rm scalerator

# Run new container
docker run -d --name scalerator -p 3002:3000 --restart unless-stopped ghcr.io/YOUR_USERNAME/scalerator-main:latest
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs scalerator

# Common issues:
# - Port 3002 already in use
# - Insufficient memory
# - Image pull failures
```

### Health Check Failures
```bash
# Test manually
docker exec scalerator wget --no-verbose --tries=1 --spider http://localhost:3000/

# Check if application is listening
docker exec scalerator netstat -tlnp
```

### GitHub Actions Build Failures
- Ensure repository has `Actions` enabled
- Check workflow permissions in repository settings
- Verify `GITHUB_TOKEN` has package write permissions

## Version Tags
- `latest`: Latest build from master branch
- `v*.*.*`: Semantic version tags (when using git tags)
- `master`: Latest master branch build

## Performance Notes
- Container starts quickly due to standalone Next.js build
- Memory usage typically under 100MB
- Health checks every 30 seconds with 3 retry attempts