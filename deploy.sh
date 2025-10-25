#!/bin/bash

# Geothermal Globe Visualization - Docker Deployment Script
# This script builds and pushes the Docker image to Docker Hub

set -e

# Configuration
IMAGE_NAME="geothermal-globe-viz"
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
VERSION="${VERSION:-latest}"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "🌍 Building Geothermal Globe Visualization Docker Image"
echo "Image: ${FULL_IMAGE_NAME}"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME} .
docker tag ${IMAGE_NAME} ${FULL_IMAGE_NAME}

# Test the image locally
echo "🧪 Testing image locally..."
docker run -d --name test-geothermal -p 8080:8080 ${IMAGE_NAME}
sleep 10

# Health check
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    docker stop test-geothermal
    docker rm test-geothermal
else
    echo "❌ Health check failed!"
    docker stop test-geothermal
    docker rm test-geothermal
    exit 1
fi

# Push to Docker Hub
echo "🚀 Pushing to Docker Hub..."
docker push ${FULL_IMAGE_NAME}

echo "✅ Successfully deployed ${FULL_IMAGE_NAME}"
echo ""
echo "🔗 To deploy on GCP Cloud Run:"
echo "gcloud run deploy geothermal-globe \\"
echo "  --image=${FULL_IMAGE_NAME} \\"
echo "  --platform=managed \\"
echo "  --region=us-central1 \\"
echo "  --allow-unauthenticated \\"
echo "  --port=8080 \\"
echo "  --memory=512Mi \\"
echo "  --cpu=1"