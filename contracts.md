# ORCA — API Contracts & Integration Plan

Base URL: `${REACT_APP_BACKEND_URL}/api`. All routes prefixed `/api`. Mongo via `MONGO_URL`.

## Design principle (from spec)
Deterministic risk engine + structured agent contracts. LLM is explain-only and NEVER
alters risk level or invents figures. Real/SIM data is tagged. Prototype = grounded, not a chatbot.

## Collections
- `profiles` — user profile (single demo user)
- `trips` — active + historical trips
- `alerts` — alert center feed
- `community_posts` — feed posts (moderation state)
- `polls` — single active poll with options/votes
- `emergencies` — SOS records + status machine
- `app_state` — current demo scenario level

## Agent pipeline (backend `agents.py`)
`POST /api/query {text, scenario?}` runs:
Planner→Context→(Weather,Ocean,Geospatial,Satellite,Tide parallel)→Evidence(conflict resolve)
→Risk(deterministic score/level)→Response(grounded text, hindi detect).
Returns `{answer:{kind,badge,tone,title,bullets,text,langTag}, risk:{level,score,confidence,...}, trace:[...], evidence:[...]}`.

Risk engine: score from wind/wave thresholds + warnings; GREEN<25, YELLOW<50, ORANGE<75, RED>=75.
Conservative conflict resolution (higher/fresher/official value wins).

## Endpoints
- `GET  /api/health`
- `GET  /api/conditions?scenario=YELLOW` → marine conditions block for home/trip
- `POST /api/query` → agent pipeline (above)
- `GET  /api/risk` → latest full risk assessment (for Risk screen)
- `GET  /api/trace` → agent trace nodes
- `GET  /api/evidence` → evidence sources + conflict
- `GET  /api/plan` → 7-day plan
- `GET  /api/alerts?scenario=` → alert feed (scenario-aware)
- `GET  /api/trip/active` → active trip dashboard
- `POST /api/trip/end` → move active trip to history + return summary
- `GET  /api/trips` → trip history
- `GET  /api/community/posts` · `POST /api/community/posts {text,kind}` · `POST /api/community/posts/{id}/helpful`
- `GET  /api/community/poll` · `POST /api/community/poll/vote {optionId}`
- `POST /api/emergency/sos {type,people}` → creates emergency (HELP_REQUESTED) + returns id
- `GET  /api/emergency/{id}` · `POST /api/emergency/{id}/cancel` · `GET /api/emergency/{id}/rescue`
- `POST /api/demo/scenario {level}` → set app scenario, returns conditions
- `GET  /api/profile` · `PUT /api/profile`
- `GET  /api/data-sources`
- `GET  /api/contacts` · `POST /api/contacts {name,phone,role}` · `DELETE /api/contacts/{id}`
- `POST /api/emergency/{id}/contact-service` → logs a timeline event for contacting emergency services
- `POST /api/emergency/{id}/share-location {lat?,lng?}` → logs a timeline event, updates position if coords given

## Mock replacement (frontend mock.js)
Replace with `src/api.js` client. AppContext calls backend on mount/actions; keeps mock.js
values as offline fallback so the prototype never looks hollow if API is unreachable.
Screens keep working identically; data now persists (community posts, poll votes, trip end,
SOS records, scenario state).

## Seeding
On startup, seed profile, poll, community posts, active trip, trip history, alerts if empty.
