# GitHub Actions Workflow Documentation

## Overview
This document explains the automated Docker build and deployment workflow configured in `.github/workflows/docker-publish.yml`. The workflow automatically builds multi-architecture Docker images and publishes them to GitHub Container Registry (GHCR) whenever code changes are pushed to the repository.

## Workflow File Location
```
.github/workflows/docker-publish.yml
```

## How It Works

### Workflow Triggers
The workflow automatically runs when:

1. **Push to main/master branches**
   ```yaml
   on:
     push:
       branches: [ "master", "main" ]
   ```
   - Triggers on every commit pushed to the main or master branch
   - Builds and publishes the image with `latest` tag

2. **Git tags with version pattern**
   ```yaml
   tags: [ 'v*.*.*' ]
   ```
   - Triggers when you create version tags like `v1.0.0`, `v2.1.3`, etc.
   - Creates additional tagged images for specific versions

3. **Pull requests**
   ```yaml
   pull_request:
     branches: [ "master", "main" ]
   ```
   - Builds and tests the image but does NOT publish to registry
   - Ensures PR changes don't break the Docker build

### Environment Variables
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
```
- `REGISTRY`: GitHub Container Registry URL
- `IMAGE_NAME`: Automatically uses your repository name (e.g., `internetkid2001/scalerator`)

## Workflow Steps Breakdown

### 1. Repository Checkout
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
```
**What it does**: Downloads your repository code to the GitHub runner

### 2. Cosign Installation (Security)
```yaml
- name: Install cosign
  if: github.event_name != 'pull_request'
  uses: sigstore/cosign-installer@v3.5.0
```
**What it does**: 
- Installs `cosign` for cryptographic signing of container images
- Only runs for actual builds (not PR tests)
- Provides supply chain security by proving image authenticity

### 3. Docker Buildx Setup
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```
**What it does**:
- Sets up advanced Docker build features
- Enables multi-architecture builds (AMD64 + ARM64)
- Provides build caching capabilities

### 4. Registry Authentication
```yaml
- name: Log into registry ${{ env.REGISTRY }}
  if: github.event_name != 'pull_request'
  uses: docker/login-action@v3
  with:
    registry: ${{ env.REGISTRY }}
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```
**What it does**:
- Logs into GitHub Container Registry using your GitHub credentials
- Uses the built-in `GITHUB_TOKEN` (no manual token setup required)
- Only authenticates for actual builds (skips PR tests)

### 5. Metadata Extraction
```yaml
- name: Extract metadata (tags, labels) for Docker
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
    tags: |
      type=ref,event=branch
      type=ref,event=pr
      type=semver,pattern={{version}}
      type=semver,pattern={{major}}.{{minor}}
      type=raw,value=latest,enable={{is_default_branch}}
```
**What it does**: Automatically generates appropriate image tags based on the trigger:

| Trigger Type | Generated Tags | Example |
|--------------|----------------|---------|
| Push to main | `latest`, `main` | `ghcr.io/user/repo:latest` |
| Push to branch | Branch name | `ghcr.io/user/repo:develop` |
| Git tag v1.2.3 | `v1.2.3`, `1.2.3`, `1.2`, `1` | `ghcr.io/user/repo:v1.2.3` |
| Pull request #42 | `pr-42` | `ghcr.io/user/repo:pr-42` |

### 6. Build and Push
```yaml
- name: Build and push Docker image
  id: build-and-push
  uses: docker/build-push-action@v5
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: ${{ github.event_name != 'pull_request' }}
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
**What it does**:
- **Multi-architecture build**: Creates images for both Intel/AMD (amd64) and ARM (arm64) processors
- **Smart pushing**: Only pushes to registry for real builds (not PR tests)
- **Build caching**: Uses GitHub Actions cache to speed up subsequent builds
- **Automatic tagging**: Applies all tags generated in the metadata step

### 7. Image Signing (Security)
```yaml
- name: Sign the published Docker image
  if: ${{ github.event_name != 'pull_request' }}
  env:
    TAGS: ${{ steps.meta.outputs.tags }}
    DIGEST: ${{ steps.build-and-push.outputs.digest }}
  run: echo "${TAGS}" | xargs -I {} cosign sign --yes {}@${DIGEST}
```
**What it does**:
- Cryptographically signs each published image
- Creates a tamper-proof signature proving the image came from your repository
- Enables verification of image authenticity when deploying

## Security Features

### 1. Minimal Permissions
```yaml
permissions:
  contents: read      # Read repository code
  packages: write     # Push to GitHub Container Registry
  id-token: write     # Required for cosign signing
```

### 2. Keyless Signing
- Uses GitHub's OIDC identity for signing (no private keys to manage)
- Signatures are publicly verifiable
- Provides supply chain security compliance

### 3. Multi-layer Security
- Uses official GitHub Actions from verified publishers
- Pins action versions for reproducibility
- Separates build and push phases for testing

## Generated Image Information

### Repository Location
Your images are published to:
```
ghcr.io/internetkid2001/scalerator
```

### Available Tags
- `latest` - Most recent build from main branch
- `main` - Latest main branch build  
- `v1.0.0` - Specific version builds (when you create git tags)
- `pr-123` - Pull request test builds (not pushed to registry)

### Architecture Support
- **linux/amd64** - Intel/AMD 64-bit (most servers, desktops)
- **linux/arm64** - ARM 64-bit (Apple Silicon, Raspberry Pi, ARM servers)

## Using the Images

### Pull and Run
```bash
# Pull latest image
docker pull ghcr.io/internetkid2001/scalerator:latest

# Run container
docker run -d -p 3000:3000 ghcr.io/internetkid2001/scalerator:latest
```

### Verify Image Signature (Optional)
```bash
# Install cosign
curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
sudo mv cosign-linux-amd64 /usr/local/bin/cosign
sudo chmod +x /usr/local/bin/cosign

# Verify signature
cosign verify ghcr.io/internetkid2001/scalerator:latest \
  --certificate-identity-regexp 'https://github.com/internetkid2001/Scalerator' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com'
```

## Monitoring and Debugging

### View Workflow Runs
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on **Build and Push Docker Image** workflow
4. Click on specific run to see detailed logs

### Common Build Information
- **Build time**: Typically 2-5 minutes
- **Log sections**: Checkout, Setup, Build, Push, Sign
- **Artifacts**: Docker images in Packages section

### Workflow Status Badges
Add to your README.md:
```markdown
[![Docker Build](https://github.com/internetkid2001/Scalerator/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/internetkid2001/Scalerator/actions/workflows/docker-publish.yml)
```

## Troubleshooting

### Build Failures

#### Dockerfile Issues
```yaml
Error: failed to solve: failed to compute cache key
```
**Solution**: Check Dockerfile syntax, ensure all COPY paths exist

#### Permission Errors
```yaml
Error: denied: permission_denied
```
**Solution**: 
1. Check repository settings → Actions → General → Workflow permissions
2. Ensure "Read and write permissions" is enabled

#### Multi-arch Build Failures
```yaml
Error: failed to build for linux/arm64
```
**Solution**: 
- Ensure base images support both architectures
- Check if dependencies are available for ARM64

### Registry Issues

#### Package Visibility
If your image isn't accessible:
1. Go to GitHub → Your profile → Packages
2. Click on your package
3. Package settings → Change visibility → Public

#### Authentication Problems
```bash
Error: unauthorized: authentication required
```
**Solution**: 
```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

## Customization Options

### Change Target Platforms
```yaml
platforms: linux/amd64,linux/arm64,linux/arm/v7
```

### Add Custom Labels
```yaml
labels: |
  org.opencontainers.image.title=Scalerator
  org.opencontainers.image.description=Musical scale visualization tool
  org.opencontainers.image.vendor=Your Name
```

### Modify Trigger Conditions
```yaml
on:
  push:
    branches: [ "main", "develop" ]  # Add develop branch
    paths-ignore:                   # Skip builds for docs
      - 'docs/**'
      - '*.md'
```

### Custom Tag Patterns
```yaml
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=raw,value=nightly,enable={{is_default_branch}}
  type=raw,value={{date 'YYYYMMDD'}}
```

## Best Practices

### 1. Version Tagging
Create semantic version tags for releases:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Branch Strategy
- Use `main` branch for stable releases
- Use feature branches for development
- PRs automatically test builds without publishing

### 3. Dockerfile Optimization
- Use multi-stage builds (already implemented)
- Minimize layer count
- Use .dockerignore to exclude unnecessary files

### 4. Security
- Regularly update action versions
- Monitor security advisories
- Use image scanning tools in additional workflows

## Related Files
- `Dockerfile` - Container definition
- `docker-compose.yml` - Local development setup
- `DOCKER_DEPLOYMENT.md` - Deployment instructions
- `.dockerignore` - Build context exclusions (recommended to create)

This automated workflow ensures your Scalerator application is always available as an up-to-date, secure Docker image ready for deployment on any platform supporting containers.