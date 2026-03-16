# GitHub Actions Workflows

## Docker Build and Push Workflow

This workflow builds and pushes Docker images for the OVPN Manager services (API, Web, Agent).

### Trigger Methods

#### 1. Manual Trigger (Default) ⭐ Recommended

The workflow is configured to run **only when manually triggered** by default. This prevents unnecessary builds on every push.

**How to trigger manually:**

1. Go to GitHub repository → Actions tab
2. Select "Build and Push Docker Images" workflow
3. Click "Run workflow" button
4. Configure options:
   - **Services to build**: Choose which services to build
     - `all` - Build all services (api, web, agent)
     - `api` - Build only API service
     - `web` - Build only Web service
     - `agent` - Build only Agent service
     - `api,web` - Build multiple services (comma-separated)
   - **Push images to registry**: 
     - `true` - Build and push to GitHub Container Registry
     - `false` - Build only (for testing, no push)
5. Click "Run workflow"

**Examples:**
- Build and push all services: `services: all`, `push_images: true`
- Build only API: `services: api`, `push_images: true`
- Test build without pushing: `services: all`, `push_images: false`
- Build API and Web only: `services: api,web`, `push_images: true`

#### 2. Automatic Trigger on Version Tags

The workflow automatically runs when you push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will build and push all services with version tags.

#### 3. Automatic Trigger on File Changes (Optional)

If you want automatic builds when specific files change, uncomment this section in `.github/workflows/docker-publish.yml`:

```yaml
# Optional: Auto-trigger on push with path filters
# Uncomment the section below if you want automatic builds on specific file changes
push:
  branches:
    - main
  paths:
    - 'apps/api/**'
    - 'apps/web/**'
    - 'apps/agent/**'
    - 'packages/**'
    - 'docker-compose.yml'
    - '.github/workflows/docker-publish.yml'
```

When enabled, the workflow will:
- Detect which services have changed files
- Build only the changed services
- Skip build if no relevant files changed

### Workflow Features

#### Smart Service Detection

The workflow automatically detects which services need to be built:

- **Manual trigger**: Build services specified in input
- **Tag push**: Build all services
- **File changes** (if enabled): Build only services with changed files
  - Changes in `apps/api/` → Build API only
  - Changes in `apps/web/` → Build Web only
  - Changes in `apps/agent/` → Build Agent only
  - Changes in `packages/` → Build all services (shared code)

#### Multi-Architecture Support

Images are built for multiple architectures:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

#### Build Cache

The workflow uses GitHub Actions cache to speed up builds:
- Cache is scoped per service
- Subsequent builds are much faster

#### Automated Testing

After building, the workflow:
1. Pulls the newly built images
2. Starts API and Web services
3. Tests health endpoints
4. Reports success/failure

### Image Tags

Built images are tagged as:
- `ghcr.io/OWNER/ovpn-manager:api` - Latest API image
- `ghcr.io/OWNER/ovpn-manager:web` - Latest Web image
- `ghcr.io/OWNER/ovpn-manager:agent` - Latest Agent image
- `ghcr.io/OWNER/ovpn-manager:v1.0.0-api` - Version-tagged images

### Usage Examples

#### Scenario 1: Regular Development

You're working on the codebase and push changes frequently, but don't want to rebuild images every time.

**Solution**: Keep the default configuration (manual trigger only)

```bash
# Make changes and push
git add .
git commit -m "Update API logic"
git push origin main

# No automatic build happens

# When ready to deploy, manually trigger the workflow
# Go to Actions → Run workflow → Select services → Run
```

#### Scenario 2: Build Only Changed Services

You updated only the Web UI and want to build just that service.

**Solution**: Manual trigger with specific service

1. Go to Actions → Run workflow
2. Set `services: web`
3. Set `push_images: true`
4. Click Run workflow

#### Scenario 3: Test Build Without Pushing

You want to test if the build works without pushing to registry.

**Solution**: Manual trigger with push disabled

1. Go to Actions → Run workflow
2. Set `services: all`
3. Set `push_images: false`
4. Click Run workflow

#### Scenario 4: Release New Version

You're ready to release a new version.

**Solution**: Create and push a version tag

```bash
git tag v1.2.0
git push origin v1.2.0

# Automatically builds and pushes all services with version tags
```

#### Scenario 5: Enable Auto-Build on Changes

You want automatic builds when you push changes to specific services.

**Solution**: Uncomment the path filters section

1. Edit `.github/workflows/docker-publish.yml`
2. Uncomment the `push:` section with `paths:`
3. Commit and push

Now pushes to `main` will automatically build only changed services.

### Troubleshooting

#### Build Fails

Check the workflow logs:
1. Go to Actions tab
2. Click on the failed workflow run
3. Expand the failed step to see error details

Common issues:
- **Docker build error**: Check Dockerfile syntax
- **Test failure**: Check service health endpoints
- **Permission denied**: Ensure GITHUB_TOKEN has package write permission

#### Images Not Updating

If you manually triggered but images aren't updating:
1. Check if `push_images` was set to `true`
2. Verify the workflow completed successfully
3. Check GitHub Container Registry for new images

#### Cache Issues

If builds are using stale cache:
1. Go to Actions → Caches
2. Delete the cache for the affected service
3. Re-run the workflow

### Best Practices

1. **Use manual triggers for development**: Prevents unnecessary builds and saves CI minutes
2. **Use version tags for releases**: Provides clear versioning and automatic builds
3. **Build only changed services**: Saves time and resources
4. **Test locally first**: Use `docker compose build` locally before triggering CI
5. **Monitor CI minutes**: GitHub has limits on free CI minutes

### Configuration

To customize the workflow:

1. **Change registry**: Edit `REGISTRY` env var
2. **Change image name**: Edit `IMAGE_NAME` env var
3. **Add more services**: Add to the services array in prepare job
4. **Change platforms**: Edit `platforms` in build step
5. **Adjust test timeout**: Edit the loop count in test-deployment job

### Security

- Workflow uses `GITHUB_TOKEN` for authentication (automatic)
- Images are pushed to GitHub Container Registry (ghcr.io)
- Only users with write access can trigger workflows
- Secrets are not exposed in logs

### Support

For issues or questions:
1. Check workflow logs in Actions tab
2. Review this documentation
3. Open an issue on GitHub
