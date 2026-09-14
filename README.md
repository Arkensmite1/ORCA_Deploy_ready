# ORCA — Marine Intelligence & Safety

ORCA (Marine EcOsystem Reasoning with Collaborative Agents) is a tool-grounded,
multi-agent prototype for small-boat fisherman safety: a deterministic risk
engine (wind/wave/warnings) feeds a set of structured agent contracts
(weather, ocean, geospatial, satellite, tide, evidence), and an explain-only
response layer phrases the result in plain English/Hindi — it can never
change a risk level or invent a figure.

- **Backend:** FastAPI + Motor (MongoDB), deployable on [Render](https://render.com)
- **Frontend:** React 19 + Tailwind + shadcn/ui (CRA/craco), deployable on [Vercel](https://vercel.com)

## Project structure

```
backend/     FastAPI app (server.py), agent pipeline (agents.py)
frontend/    React app
render.yaml  Render blueprint for the backend
```

## Local development

### Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URL (e.g. a MongoDB Atlas URI)
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Frontend
```bash
cd frontend
cp .env.example .env      # REACT_APP_BACKEND_URL=http://localhost:8000
yarn install               # or npm install
yarn start
```

## Deployment

### Backend on Render
1. Push this repo to GitHub.
2. In Render, **New → Blueprint**, point it at the repo — it will pick up `render.yaml`.
   (Or create a Web Service manually with root directory `backend`, build command
   `pip install -r requirements.txt`, start command
   `uvicorn server:app --host 0.0.0.0 --port $PORT`.)
3. Set environment variables on the service:
   - `MONGO_URL` — a MongoDB Atlas connection string (Render has no managed Mongo)
   - `DB_NAME` — e.g. `orca`
   - `CORS_ORIGINS` — your Vercel frontend URL(s), comma-separated
   - `OPENAI_API_KEY` *(optional)* — enables real LLM phrasing in the
     explain-only response layer; the app works fully without it (it falls
     back to deterministic templates)
   - `OPENAI_MODEL` *(optional)* — defaults to `gpt-4o-mini`
4. Deploy. Note the resulting service URL, e.g. `https://orca-backend.onrender.com`.

### Frontend on Vercel
1. In Vercel, **New Project**, import the repo, set the **root directory** to `frontend`.
2. Vercel auto-detects `vercel.json` (build command `craco build`, output `build`).
3. Add environment variable `REACT_APP_BACKEND_URL` = your Render backend URL
   (no trailing slash), e.g. `https://orca-backend.onrender.com`.
4. Deploy.

## Notes
- Every AI-generated number (risk score, wind, waves, confidence) comes from
  the deterministic `agents.py` risk engine — the optional OpenAI call only
  rephrases already-computed text and cannot alter any figure.
- `REAL`/`SIM` tags throughout the API mark which data is a live feed vs. a
  seeded/simulated dataset for this prototype (see `contracts.md`).
