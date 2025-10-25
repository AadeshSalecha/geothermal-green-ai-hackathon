# 🚀 Deploy from GitHub to Cloud Run

This guide shows how to deploy directly from your GitHub repository to Google Cloud Run without using Docker Hub.

## 🔧 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **GitHub repository** with your code
3. **gcloud CLI** installed and authenticated

## 📋 Setup Steps

### 1. Enable Required APIs

```bash
# Enable required Google Cloud APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 2. Connect GitHub Repository

```bash
# Connect your GitHub repo to Cloud Build
gcloud builds triggers create github \
  --repo-name=your-repo-name \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

### 3. Deploy Directly from Source

**Option A: Deploy from Local Source**
```bash
gcloud run deploy geothermal-globe \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1
```

**Option B: Deploy from GitHub (Manual)**
```bash
gcloud run deploy geothermal-globe \
  --source=https://github.com/your-username/your-repo-name \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1
```

## 🔄 Automatic Deployments

Once you set up the Cloud Build trigger, every push to `main` branch will:

1. ✅ Automatically build your Docker image
2. ✅ Push to Google Container Registry
3. ✅ Deploy to Cloud Run
4. ✅ Update your live application

## 🎯 Benefits of GitHub Integration

- **No Docker Hub needed**: Uses Google Container Registry
- **Automatic deployments**: Push to deploy
- **Build logs**: Full visibility in Cloud Console
- **Rollback support**: Easy version management
- **Cost effective**: Only pay for build time and Cloud Run usage

## 🔐 Permissions

Cloud Build needs these permissions (automatically granted):
- Cloud Run Admin
- Storage Admin
- Container Registry Service Agent

## 📊 Monitoring

Monitor your deployments:
- **Cloud Build**: https://console.cloud.google.com/cloud-build
- **Cloud Run**: https://console.cloud.google.com/run
- **Container Registry**: https://console.cloud.google.com/gcr

## 🐛 Troubleshooting

**Build fails?**
```bash
# Check build logs
gcloud builds log --region=us-central1
```

**Permission issues?**
```bash
# Check Cloud Build service account permissions
gcloud projects get-iam-policy PROJECT_ID
```

## 💡 Pro Tips

1. **Branch Protection**: Set up branch protection on `main`
2. **Environment Variables**: Add secrets in Cloud Build
3. **Custom Domains**: Map your domain to Cloud Run
4. **SSL**: Automatic HTTPS with Cloud Run

## 🚀 Quick Start Command

```bash
# One command to deploy from current directory
gcloud run deploy geothermal-globe \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=8080
```

This will build and deploy your app in one step! 🌍✨