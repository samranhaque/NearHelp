# Deploy NearHelp on Vercel

NearHelp uses one Vercel project for its Next.js website and Express/Socket.IO backend. Vercel Services routes `/api/*`, `/socket.io/*`, and `/health` to the backend; other paths go to the website. The root `vercel.json` contains this routing.

## Vercel project settings

Before deploying this configuration:

1. Set the Vercel project's **Root Directory** to the repository root (the folder containing `vercel.json`), not `frontend/`.
2. In **Settings → Build and Deployment**, set the framework to **Services**. Vercel Services is currently in beta and the option must be available to the project.
3. Add the environment variables below for Production (and Preview too, if preview deployments should use the real backend).
4. Redeploy after saving the settings.

## Environment variables

| Variable | Required | Used by | Value |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Yes | Backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Backend | Supabase service role key; keep private |
| `ACCESS_TOKEN_SECRET` | Yes | Backend | Long, random secret used to sign access tokens |
| `REFRESH_TOKEN_SECRET` | Yes | Backend | A different long, random secret used to sign refresh tokens |
| `REDIS_URL` | Yes for Vercel | Backend | Redis connection URL with Pub/Sub support; used by Socket.IO across backend instances |
| `CLIENT_URL` | Recommended | Backend | Full production site origin, for example `https://your-project.vercel.app` |
| `GEMINI_API_KEY` | If using AI features | Website and backend | Google Gemini API key |
| `GEMINI_API_KEY_2` | Optional | Website | Additional Gemini key for the website's AI route |
| `GOOGLE_MAPS_API_KEY` | Optional | Backend | Google Maps key for nearby resource lookups |

Create secrets in Vercel or a password manager. Do not commit them to Git or paste them into chat. `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` are not needed for the same-domain Vercel Services setup.

## Verify the deployment

After a successful deployment, open `https://your-project.vercel.app/health`. A ready deployment should return JSON with `"status":"ok"` and `"realtime":"ready"`. If it returns an error, check the backend service logs and its Redis/Supabase environment variables.

Then sign in with a test account, verify the Socket.IO connection, and send one SOS while a second test session is connected. Confirm that the second session receives the alert and that the SOS appears in the dashboard. Do not use real emergency contacts for a test.
