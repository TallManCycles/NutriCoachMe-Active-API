# Portainer Deployment Guide

## Option 1: Make Image Public (Recommended)

The GitHub Action now automatically makes the container image public after building. After the next push to main:

1. The image will be publicly accessible
2. No authentication needed in Portainer
3. Deploy using the docker-compose.yml as-is

## Option 2: Use Authentication in Portainer

If you prefer to keep the image private:

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `read:packages` scope
3. Copy the token

### Step 2: Configure Portainer Registry

1. Go to Portainer → Registries
2. Add registry with:
   - Name: `GitHub Container Registry`
   - Registry URL: `ghcr.io`
   - Username: `your-github-username`
   - Password: `your-personal-access-token`

### Step 3: Deploy Stack

1. Create new stack in Portainer
2. Paste your docker-compose.yml content
3. Add environment variables in the Environment variables section
4. Deploy

## Environment Variables for Portainer

Add these in your Portainer stack environment variables:

```
ACCESS_TOKEN_URL=https://connectapi.garmin.com/oauth-service/oauth/access_token
API_KEY=your_sendgrid_api_key
AUTHORIZE_URL=https://connect.garmin.com/oauthConfirm
GARMIN_CONSUMER_KEY=your_garmin_consumer_key
GARMIN_CONSUMER_SECRET=your_garmin_consumer_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=https://nutriapi.supadatabase.com.au/api/googleoauth
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mail.nutricoachme.com
OPENAI_API_KEY=your_openai_api_key
OPENAI_ASSISTANT_ID=your_openai_assistant_id
REQUEST_TOKEN_URL=https://connectapi.garmin.com/oauth-service/oauth/request_token
STRIPE_LIVE_SECRET_KEY=your_stripe_live_secret_key
STRIPE_LIVE_WEBHOOK_SECRET=your_stripe_live_webhook_secret
STRIPE_TEST_SECRET_KEY=your_stripe_test_secret_key
STRIPE_TEST_WEBHOOK_SECRET=your_stripe_test_webhook_secret
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_KEY=your_supabase_key
PORT=3000
```

## Troubleshooting

- **Version warning**: Fixed by removing version from docker-compose.yml
- **Unauthorized error**: Wait for next push to main to make image public, or use registry authentication
- **Port conflicts**: Change the PORT environment variable in Portainer