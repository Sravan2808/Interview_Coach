# Repository Guidelines

## Project Structure & Module Organization

This workspace contains the Next.js frontend; the FastAPI backend is in the sibling `../backend` directory. Frontend routes and shared UI live in `src/app/` and `src/components/ui/`; shared helpers are in `src/lib/`. Backend endpoints are grouped in `../backend/routers/`, request models in `../backend/schemas.py`, and model integration in `../backend/services/`. No test directory or test suite is currently present.

## Build, Test, and Development Commands

- `npm.cmd run dev` starts the frontend at `http://localhost:3000` (use `npm.cmd` in PowerShell if script execution blocks `npm`).
- `npm run build` creates a production build; `npm start` serves it locally after building.
- `npm run lint` runs Next.js lint checks.
- From `../backend`, run `python -m uvicorn main:app --reload --port 8000` to start the API. Install `requirements.txt` in a suitable Python environment first.

## Coding Style & Naming Conventions

Use TypeScript and React for frontend changes, with strict TypeScript checks enabled. Follow the existing two-space JSON/TS formatting, use PascalCase for React components, camelCase for variables and functions, and kebab-case for route directories where appropriate. Keep reusable UI in `src/components/` and API routes in focused FastAPI router modules. ESLint uses `next/core-web-vitals` and `next/typescript`; run `npm run lint` before submitting frontend changes.

## Testing Guidelines

There is no configured automated test framework or coverage target. For frontend changes, run lint and the production build. For API changes, start the FastAPI app and exercise the affected route with representative request data; add focused tests if introducing a test framework.

## Commit & Pull Request Guidelines

Git history is not available from this workspace, so no repository-specific commit convention could be confirmed. Use short, imperative commit subjects (for example, `Add report loading state`). Pull requests should describe user-visible changes, list validation performed, link related issues when available, and include screenshots for visual changes.

## Security & Configuration

Keep credentials in local environment files and never commit secrets. The backend expects `GEMINI_API_KEY`; use `.env.example` as the configuration template. The frontend API base URL is set with `NEXT_PUBLIC_API_URL` in `.env.local`.
