#!/bin/bash

# Pixel Arcade Deployment Script for Rocky Linux
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Pixel Arcade Deployment..."

# Configuration
APP_DIR="/var/www/pixel-arcade"
BACKUP_DIR="/var/backups/pixel-arcade"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root or with sudo${NC}"
  exit 1
fi

# Create directories if they don't exist
mkdir -p "$APP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup current deployment
if [ -d "$APP_DIR/dist" ]; then
  echo -e "${YELLOW}Backing up current deployment...${NC}"
  cp -r "$APP_DIR/dist" "$BACKUP_DIR/dist_$TIMESTAMP"
fi

# Install Node.js and npm if not present
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Installing Node.js...${NC}"
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}Installing Nginx...${NC}"
  dnf install -y nginx
  systemctl enable nginx
fi

# Build the project
echo -e "${YELLOW}Building project...${NC}"
npm ci
npm run build

# Deploy
echo -e "${YELLOW}Deploying to $APP_DIR...${NC}"
cp -r dist/* "$APP_DIR/"

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/conf.d/pixel-arcade.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/pixel-arcade;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

# Set permissions
chown -R nginx:nginx "$APP_DIR"
chmod -R 755 "$APP_DIR"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Your application is now live at http://$(hostname -I | awk '{print $1}')${NC}"

# Cleanup old backups (keep last 5)
ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
echo -e "${YELLOW}Cleaned up old backups. Kept last 5.${NC}"
