# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Campus-Pass application to production environments. It covers various deployment strategies, environment configurations, and best practices.

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or MongoDB server
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Git repository access

## Deployment Options

### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)
### Option 2: Platform as a Service (Heroku, Railway, Render)
### Option 3: Containerized (Docker + Kubernetes)
### Option 4: Serverless (AWS Lambda, Vercel)

---

## Option 1: VPS Deployment (Recommended)

### 1. Server Setup

#### 1.1 Create Server
- **Provider**: DigitalOcean, AWS EC2, Linode, etc.
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 25GB SSD minimum

#### 1.2 Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git
```

### 2. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Configure network access (add your server IP)
4. Create database user
5. Get connection string

#### Option B: Self-hosted MongoDB

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Secure MongoDB
sudo mongo
> use admin
> db.createUser({
    user: "admin",
    pwd: "your_secure_password",
    roles: ["root"]
  })
> exit
```

### 3. Application Deployment

#### 3.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/campuspass
sudo chown -R $USER:$USER /var/www/campuspass

# Clone repository
cd /var/www/campuspass
git clone https://github.com/yourusername/campuspass.git .
```

#### 3.2 Backend Setup

```bash
cd /var/www/campuspass/backend

# Install dependencies
npm install --production

# Create environment file
nano .env
```

**Backend .env Configuration**:
```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campuspass?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@campuspass.com
FROM_NAME=Campus-Pass

# Frontend URL
FRONTEND_URL=https://campuspass.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://campuspass.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name campuspass-backend
pm2 save
pm2 startup
```

#### 3.3 Frontend Setup

```bash
cd /var/www/campuspass/frontend

# Install dependencies
npm install

# Create environment file
nano .env.production
```

**Frontend .env.production Configuration**:
```env
VITE_API_URL=https://api.campuspass.com
VITE_SOCKET_URL=https://api.campuspass.com
VITE_APP_NAME=Campus-Pass
VITE_APP_VERSION=1.0.0
```

```bash
# Build for production
npm run build

# The build output will be in the 'dist' directory
```

### 4. Nginx Configuration

#### 4.1 Backend Proxy Configuration

```bash
sudo nano /etc/nginx/sites-available/campuspass-api
```

```nginx
server {
    listen 80;
    server_name api.campuspass.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

#### 4.2 Frontend Configuration

```bash
sudo nano /etc/nginx/sites-available/campuspass-frontend
```

```nginx
server {
    listen 80;
    server_name campuspass.com www.campuspass.com;
    root /var/www/campuspass/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4.3 Enable Sites

```bash
# Enable configurations
sudo ln -s /etc/nginx/sites-available/campuspass-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/campuspass-frontend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup

```bash
# Obtain SSL certificates
sudo certbot --nginx -d campuspass.com -d www.campuspass.com
sudo certbot --nginx -d api.campuspass.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 7. Monitoring Setup

#### 7.1 PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs campuspass-backend

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### 7.2 System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup automated monitoring (optional)
# Consider services like:
# - Datadog
# - New Relic
# - Prometheus + Grafana
```

---

## Option 2: Platform as a Service (PaaS)

### Heroku Deployment

#### 1. Prepare Application

```bash
# Create Procfile in backend directory
echo "web: node dist/index.js" > backend/Procfile

# Create Procfile in frontend directory
echo "web: npm run preview" > frontend/Procfile
```

#### 2. Deploy Backend

```bash
cd backend

# Login to Heroku
heroku login

# Create app
heroku create campuspass-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
# ... set all other env variables

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=1
```

#### 3. Deploy Frontend

```bash
cd frontend

# Create app
heroku create campuspass-frontend

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set VITE_API_URL=https://campuspass-api.herokuapp.com

# Deploy
git push heroku main
```

### Railway Deployment

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Render Deployment

1. Connect GitHub repository
2. Configure build commands
3. Set environment variables
4. Deploy

---

## Option 3: Docker Deployment

### 1. Create Dockerfiles

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    restart: always
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password@mongodb:27017/campuspass?authSource=admin
      JWT_SECRET: your_jwt_secret
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Post-Deployment Checklist

### Security
- [ ] SSL certificates installed
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Firewall configured
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] Regular security updates scheduled

### Performance
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] CDN setup (optional)
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Load balancing setup (if needed)

### Monitoring
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log aggregation (Papertrail)
- [ ] Analytics setup (Google Analytics)

### Backup
- [ ] Database backup automated
- [ ] File backup configured
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented

### Documentation
- [ ] API documentation published
- [ ] User guide created
- [ ] Admin guide created
- [ ] Troubleshooting guide available

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check system resources
- Review security alerts

#### Weekly
- Review performance metrics
- Check backup integrity
- Update dependencies (dev environment first)

#### Monthly
- Security audit
- Performance optimization
- Database maintenance
- SSL certificate check

### Update Procedure

```bash
# 1. Backup database
mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y%m%d)

# 2. Pull latest code
cd /var/www/campuspass
git pull origin main

# 3. Update backend
cd backend
npm install
npm run build
pm2 restart campuspass-backend

# 4. Update frontend
cd ../frontend
npm install
npm run build

# 5. Verify deployment
curl https://api.campuspass.com/health
curl https://campuspass.com

# 6. Monitor logs
pm2 logs campuspass-backend --lines 100
```

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check PM2 logs
pm2 logs campuspass-backend

# Check system resources
htop

# Verify environment variables
pm2 env 0
```

#### 2. Database Connection Issues

```bash
# Test MongoDB connection
mongo "your_mongodb_uri"

# Check network connectivity
ping your-mongodb-host

# Verify credentials
```

#### 3. Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Scaling Strategies

### Vertical Scaling
- Upgrade server resources (CPU, RAM)
- Optimize database queries
- Implement caching (Redis)

### Horizontal Scaling
- Load balancer setup (Nginx, HAProxy)
- Multiple application instances
- Database replication
- CDN for static assets

### Database Scaling
- MongoDB sharding
- Read replicas
- Connection pooling
- Query optimization

---

## Cost Estimation

### Small Scale (< 1000 users)
- **VPS**: $10-20/month
- **MongoDB Atlas**: $0-9/month (Free tier)
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$15-30/month

### Medium Scale (1000-10000 users)
- **VPS**: $40-80/month
- **MongoDB Atlas**: $57/month (M10)
- **CDN**: $10-20/month
- **Monitoring**: $20-50/month
- **Total**: ~$130-200/month

### Large Scale (10000+ users)
- **Load Balancer**: $10-20/month
- **Multiple VPS**: $200-400/month
- **MongoDB Atlas**: $200+/month
- **CDN**: $50-100/month
- **Monitoring**: $100+/month
- **Total**: ~$560-820/month

---

## Support & Resources

- **Documentation**: https://docs.campuspass.com
- **GitHub**: https://github.com/yourusername/campuspass
- **Issues**: https://github.com/yourusername/campuspass/issues
- **Email**: support@campuspass.com

---

**Last Updated**: 2024
**Version**: 1.0.0