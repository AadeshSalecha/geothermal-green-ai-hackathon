# 🌍 Geothermal Globe Visualization - Deployment Guide

This guide will help you deploy the Geothermal Globe Visualization to GCP Cloud Run using Docker.

## 📋 Prerequisites

- Docker installed locally
- Docker Hub account
- GCP account with Cloud Run enabled
- `gcloud` CLI installed and authenticated

## 🚀 Quick Deployment

### Step 1: Build and Test Locally

```bash
# Build the Docker image
npm run docker:build

# Test locally
npm run docker:run

# Visit http://localhost:8080 to verify it works
```

### Step 2: Push to Docker Hub

```bash
# Set your Docker Hub username
export DOCKER_USERNAME="your-dockerhub-username"

# Build and push (automated script)
./deploy.sh
```

### Step 3: Deploy to GCP Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy geothermal-globe \
  --image=your-dockerhub-username/geothermal-globe-viz:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10
```

## 🔧 Manual Steps

### Build Docker Image

```bash
docker build -t geothermal-globe-viz .
```

### Tag for Docker Hub

```bash
docker tag geothermal-globe-viz your-username/geothermal-globe-viz:latest
```

### Push to Docker Hub

```bash
docker push your-username/geothermal-globe-viz:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy geothermal-globe \
  --image=your-username/geothermal-globe-viz:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080
```

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **3D Visualization**: Cesium.js
- **Styling**: Tailwind CSS
- **Web Server**: Nginx (Alpine)
- **Container**: Multi-stage Docker build
- **Hosting**: GCP Cloud Run

## 📊 Resource Requirements

- **Memory**: 512Mi (recommended minimum)
- **CPU**: 1 vCPU
- **Port**: 8080
- **Max Instances**: 10 (adjust based on traffic)

## 🔍 Health Checks

The application includes a health check endpoint at `/health` that returns:
- Status: 200 OK
- Response: "healthy"

## 🌐 Environment Variables

No environment variables required for basic deployment. The app uses:
- OpenStreetMap for base imagery (no API key needed)
- Static GeoJSON data included in build

## 🔒 Security Features

- Security headers configured in Nginx
- Content Security Policy enabled
- XSS protection enabled
- HTTPS enforced by Cloud Run

## 📈 Monitoring

Cloud Run provides built-in monitoring for:
- Request latency
- Request count
- Error rate
- Memory/CPU usage

## 🐛 Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version (requires 18+)
2. **Cesium not loading**: Verify vite-plugin-cesium is working
3. **404 errors**: Check nginx.conf routing configuration
4. **Memory issues**: Increase Cloud Run memory allocation

### Logs

```bash
# View Cloud Run logs
gcloud logs read --service=geothermal-globe --limit=50
```

## 💰 Cost Estimation

GCP Cloud Run pricing (approximate):
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Requests**: $0.40 per million requests

For a low-traffic app (~1000 requests/month):
- Estimated cost: $1-5/month

## 🔄 Updates

To update the deployment:

1. Make code changes
2. Run `./deploy.sh` to build and push new image
3. Cloud Run will automatically deploy the new version

## 📞 Support

For deployment issues:
- Check Cloud Run logs
- Verify Docker image works locally
- Ensure all required files are included in build