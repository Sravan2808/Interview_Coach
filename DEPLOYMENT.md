# Deploying AI Interview Coach

This repository contains a Next.js frontend in `frontend/` and a FastAPI backend in `backend/`.

## 1. Push the repository to GitHub

Vercel and Render both need access to a Git repository. Create a GitHub repository, then from this project folder initialize Git, commit the project, and push it. Do not add `backend/.env`; the root `.gitignore` excludes local secrets and environment files.

```powershell
git init
git add .
git commit -m "Prepare AI Interview Coach for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

## 2. Create the Vercel project first

1. In Vercel, import the GitHub repository.
2. Set **Root Directory** to `frontend`. Keep the detected Next.js framework and default install/build commands.
3. Deploy once to get the Vercel production origin, such as `https://your-project.vercel.app`. The API connection will be configured after Render is deployed.

Vercel supports selecting an application folder as the project root for a monorepo; set this to `frontend`.

## 3. Deploy the backend to Render

1. In Render, create a new **Blueprint** and select the same GitHub repository.
2. Render will read the root `render.yaml` and create the `ai-interview-coach-api` service using `backend/` as its root.
3. Set `GEMINI_API_KEY` to your Gemini API key when prompted. Set `FRONTEND_URL` to the Vercel production origin. Use comma-separated origins if you need more than one.
4. Deploy the service and copy its public URL, such as `https://ai-interview-coach-api.onrender.com`.
5. Check that opening the service URL returns the API health message.

The Blueprint defines the backend root directory, dependency install command, Uvicorn start command, health check, and environment variables.

## 4. Connect Vercel to Render

1. In Vercel project settings, add `NEXT_PUBLIC_API_URL` with the Render service URL (origin only, with no trailing slash).
2. Apply the variable to the environments you will deploy, then redeploy the frontend. Next.js includes this public variable in the client build.
3. Confirm the Render `FRONTEND_URL` exactly matches the Vercel origin, including `https://` and any custom domain. If you change the Vercel domain, update `FRONTEND_URL` in Render and redeploy the API.

For local development, keep `frontend/.env.local` pointed at `http://localhost:8000`. The committed `frontend/.env.example` is only a template; do not put secrets in it.
