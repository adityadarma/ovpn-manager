#!/bin/sh
# Runtime environment variable injection for Next.js
# This allows changing NEXT_PUBLIC_API_URL without rebuilding the image

set -e

# Default values
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3001}

# Create runtime config
cat > /app/apps/web/public/env-config.js << EOF
window.__ENV__ = {
  NEXT_PUBLIC_API_URL: "${NEXT_PUBLIC_API_URL}"
};
EOF

echo "✅ Runtime environment injected:"
echo "   NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"

# Start Next.js server
exec node apps/web/server.js
