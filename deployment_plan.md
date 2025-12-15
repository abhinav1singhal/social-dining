# Google Cloud Deployment Plan 🚀☁️

This guide outlines the steps to deploy your **Social Dining** app to **Google Cloud Run** using PowerShell.

## Prerequisites
1.  **Google Cloud SDK** installed and initialized (`gcloud init`).
2.  **Docker** installed (optional, but good for local testing; `gcloud builds` works without it).
3.  **Project ID**: You need your Google Cloud Project ID (e.g., `yelp-together-123`).

---

## Part 1: Backend Deployment (Python/FastAPI)

We will deploy the backend first because the frontend needs the backend's URL.

### 1. Open PowerShell and navigate to Backend
```powershell
cd c:\Abhinav\tutorial\social-dining\backend
```

### 2. Enable Cloud Build and Run Services (One-time setup)
```powershell
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### 3. Build & Submit Container Image
Replace `[YOUR-PROJECT-ID]` with your actual project ID.
```powershell
gcloud builds submit --tag gcr.io/[YOUR-PROJECT-ID]/yelp-backend
```

### 4. Deploy to Cloud Run
```powershell
gcloud run deploy yelp-backend `
  --image gcr.io/[YOUR-PROJECT-ID]/yelp-backend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 8080
```
*Note: The backtick (`) is the line continuation character in PowerShell.*

### 5. Configure Environment Variables
Cloud Run needs your secrets. You can set them via command line:
```powershell
gcloud run services update yelp-backend `
  --region us-central1 `
  --set-env-vars "SUPABASE_URL=your_db_url,SUPABASE_KEY=your_key,YELP_API_KEY=your_yelp_key"
```
*(Or use the Google Cloud Console UI to add these safely).*

### 6. Get the Backend URL
Copy the "Service URL" from the output (e.g., `https://yelp-backend-xyz.a.run.app`).

---

## Part 2: Frontend Deployment (Next.js)

### 1. Navigate to Frontend
```powershell
cd ..\frontend
```

### 2. Build & Submit Container Image
**Crucial**: You must provide the backend URL *during build time* for Next.js to bake it in (or configure runtime env vars, but build-time is easier for simple setups).

```powershell
gcloud builds submit --tag gcr.io/[YOUR-PROJECT-ID]/yelp-frontend `
  --substitutions=_NEXT_PUBLIC_API_URL="https://yelp-backend-xyz.a.run.app"
```
*(Note: If creating a build trigger is complex, a simpler way is to just hardcode the URL in `.env.production` before building, or use Runtime Environment Variables which Next.js supports via `publicRuntimeConfig` - but for this tutorial, we will set it as an ENV var in the deployment step).*

**Simpler Approach for Tutorial:**
1.  Open `c:\Abhinav\tutorial\social-dining\frontend\.env.production` (Create if missing).
2.  Add: `NEXT_PUBLIC_API_URL=https://yelp-backend-xyz.a.run.app`
3.  Run build submit:
```powershell
gcloud builds submit --tag gcr.io/[YOUR-PROJECT-ID]/yelp-frontend
```

### 3. Deploy to Cloud Run
```powershell
gcloud run deploy yelp-frontend `
  --image gcr.io/[YOUR-PROJECT-ID]/yelp-frontend `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 3000
```

---

## Part 3: Verification

1.  Open the **Frontend Service URL** provided by the last command.
2.  Create a session.
3.  Check if it connects to the backend correctly.

---

## Troubleshooting

-   **503 Service Unavailable**: Check Cloud Run logs (`gcloud logging read "resource.type=cloud_run_revision" --limit 10`).
-   **Database Error**: Ensure `SUPABASE_URL` and `SUPABASE_KEY` are correct in the Backend Service "Variables" tab.
