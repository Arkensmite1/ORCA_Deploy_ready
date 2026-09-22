from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

import agents

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="ORCA API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("orca")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def now_clock():
    return datetime.now(timezone.utc).strftime("%I:%M %p").lstrip("0")


# --------------------------- Models ---------------------------
class QueryIn(BaseModel):
    text: str
    scenario: Optional[str] = "YELLOW"


class ScenarioIn(BaseModel):
    level: str


class PostIn(BaseModel):
    text: str
    kind: Optional[str] = "hazard"


class VoteIn(BaseModel):
    optionId: str


class SosIn(BaseModel):
    type: Optional[str] = "Engine failure"
    people: Optional[int] = 3
    scenario: Optional[str] = "RED"


class ContactIn(BaseModel):
    name: str
    phone: str
    role: Optional[str] = "Contact"


class ShareLocationIn(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None


class ReportIn(BaseModel):
    reason: Optional[str] = "inappropriate"


class ProfileIn(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    vessel: Optional[str] = None
    contact: Optional[str] = None
    homePort: Optional[str] = None


# --------------------------- Seed data ---------------------------
SEED_PLAN = [
    {"day": 1, "label": "Day 1 · Tomorrow", "badge": "GO", "tone": "green",
     "text": "Fishing window 6:00 AM – 2:00 PM · Zone B", "sub": "Return before 3:00 PM deterioration window"},
    {"day": 2, "label": "Day 2", "badge": "GO", "tone": "green",
     "text": "No significant risk currently forecast. ORCA will reassess closer to the date."},
    {"day": 3, "label": "Day 3", "badge": "RECONSIDER", "tone": "orange", "changed": True,
     "text": "Conditions have changed since this plan was made. Consider postponing or moving to Zone D."},
    {"day": 4, "label": "Day 4", "badge": "GO", "tone": "green",
     "text": "No significant risk currently forecast. ORCA will reassess closer to the date."},
    {"day": 5, "label": "Day 5", "badge": "GO", "tone": "green",
     "text": "No significant risk currently forecast. ORCA will reassess closer to the date."},
    {"day": 6, "label": "Day 6", "badge": "WATCH", "tone": "yellow",
     "text": "Swell forecast trending upward — ORCA will reassess tonight and notify you if the window shifts."},
    {"day": 7, "label": "Day 7", "badge": "GO", "tone": "green",
     "text": "No significant risk currently forecast. ORCA will reassess closer to the date."},
]

SEED_ALERTS = [
    {"id": "a1", "tone": "orange", "badge": "WARNING", "time": "12:00 PM",
     "title": "Marine conditions deteriorating near your route",
     "sub": "Wind and wave conditions rising · tap to view trip", "link": "trip", "minLevel": 2},
    {"id": "a2", "tone": "yellow", "badge": "ADVISORY", "time": "11:15 AM",
     "title": "Wind speed trending upward (grouped: 4 updates)", "minLevel": 1},
    {"id": "a3", "tone": "teal", "badge": "INFO", "time": "9:32 AM",
     "title": "Trip started — Fishing Zone B", "sub": "Acknowledged", "faded": True, "minLevel": 0},
]
SEED_ALERTS_HIGH = [
    {"id": "a0", "tone": "red", "badge": "CRITICAL", "time": "12:05 PM",
     "title": "Cyclone warning issued for Ratnagiri coast",
     "sub": "Official bulletin · return to shelter immediately", "link": "trip", "minLevel": 3},
]

SEED_POSTS = [
    {"id": "c1", "author": "Suresh P.", "initials": "SP", "verified": True, "time": "12 min ago",
     "tag": "TRUSTED", "tagClass": "green",
     "text": "Waves picking up near Zone B, came in early. Sky looks clear otherwise.", "helpful": 14},
    {"id": "c2", "author": "Anil K.", "initials": "AK", "verified": False, "time": "40 min ago",
     "tag": "OBSERVATION", "tagClass": "sim",
     "text": "Good catch near the harbour mouth this morning.", "helpful": 6},
]

SEED_POLL = {
    "id": "poll1", "question": "How are sea conditions near Zone B right now?",
    "options": [
        {"id": "calm", "label": "Calm", "votes": 8, "tint": "var(--surface-alt)"},
        {"id": "moderate", "label": "Moderate", "votes": 23, "tint": "var(--yellow-tint)"},
        {"id": "rough", "label": "Rough", "votes": 11, "tint": "var(--orange-tint)"},
    ],
}

SEED_TRIPS = [
    {"id": "t1", "zone": "Fishing Zone B", "badge": "SAFE", "tone": "green",
     "when": "Yesterday · 6:00 AM – 2:40 PM · 8h 40m",
     "detail": "2 advisories, 0 emergencies · 14.2 km round trip",
     "summary": {"duration": "8h 40m", "distance": "14.2 km", "alerts": "2 advisories",
                 "emergencies": "None",
                 "note": "Conditions stayed within forecast for most of the trip. Wind rose earlier than predicted around 1 PM — logged for future forecast comparison."}},
    {"id": "t2", "zone": "Fishing Zone A", "badge": "1 WARNING", "tone": "orange",
     "when": "3 days ago · 5:30 AM – 1:10 PM · 7h 40m",
     "detail": "Wind advisory at 11:15 AM · returned safely"},
    {"id": "t3", "zone": "Fishing Zone C", "badge": "SAFE", "tone": "green",
     "when": "6 days ago · 6:15 AM – 12:50 PM · 6h 35m"},
]

SEED_PROFILE = {
    "id": "demo-user", "name": "Ramesh Koli", "language": "English",
    "vessel": "Small motorboat", "contact": "+91 98••• ••452 · Wife",
    "homePort": "Ratnagiri Harbour", "initials": "RK", "firstName": "Ramesh",
    "coast": "Ratnagiri coast",
}

SEED_CONTACTS = [
    {"id": "ct1", "name": "Wife — Sunita Koli", "role": "Primary", "phone": "+91 98765 00452"},
    {"id": "ct2", "name": "Ratnagiri Coastal Police", "role": "Authority", "phone": "+91 23522 00100"},
]

DATA_SOURCES = [
    {"name": "Weather", "tag": "REAL", "detail": "IMD gridded API"},
    {"name": "Ocean / waves", "tag": "SIM", "detail": "Seeded sample dataset"},
    {"name": "Satellite (SST/chlorophyll)", "tag": "SIM", "detail": "Prototype dataset"},
    {"name": "Marine warnings", "tag": "REAL", "detail": "Official bulletin feed"},
    {"name": "Rescue integration", "tag": "SIM", "detail": "Simulated — pending agency integration"},
]

LEVEL_RANK = {"GREEN": 0, "YELLOW": 1, "ORANGE": 2, "RED": 3}


async def seed():
    if not await db.profiles.find_one({"id": "demo-user"}):
        await db.profiles.insert_one(dict(SEED_PROFILE))
    if await db.community_posts.count_documents({}) == 0:
        await db.community_posts.insert_many([dict(p) for p in SEED_POSTS])
    if not await db.polls.find_one({"id": "poll1"}):
        await db.polls.insert_one(dict(SEED_POLL))
    if await db.trips.count_documents({}) == 0:
        await db.trips.insert_many([dict(t) for t in SEED_TRIPS])
    if not await db.app_state.find_one({"id": "state"}):
        await db.app_state.insert_one({"id": "state", "scenario": "YELLOW"})
    if await db.contacts.count_documents({}) == 0:
        await db.contacts.insert_many([dict(c) for c in SEED_CONTACTS])


@app.on_event("startup")
async def _startup():
    await seed()


def clean(doc: dict) -> dict:
    if doc:
        doc.pop("_id", None)
    return doc


async def current_scenario() -> str:
    st = await db.app_state.find_one({"id": "state"})
    return (st or {}).get("scenario", "YELLOW")


# --------------------------- Routes ---------------------------
@api.get("/health")
async def health():
    return {"status": "ok", "service": "orca", "time": now_iso()}


@api.get("/conditions")
async def conditions(scenario: Optional[str] = None):
    level = scenario or await current_scenario()
    c = agents.get_conditions(level)
    return {k: c[k] for k in ("level", "levelLabel", "wind", "waves", "alertsActive",
                              "updated", "ribbon", "weather", "ocean")}


@api.post("/query")
async def query(body: QueryIn):
    level = body.scenario or await current_scenario()
    result = agents.run_query(body.text, level)
    await db.queries.insert_one({"id": str(uuid.uuid4()), "text": body.text,
                                 "intent": result["intent"], "level": result["risk"]["level"],
                                 "ts": now_iso()})
    return result


@api.get("/risk")
async def risk(scenario: Optional[str] = None):
    level = scenario or await current_scenario()
    result = agents.run_query("Can I go fishing tomorrow morning?", level)
    r = result["risk"]
    r["dialOffset"] = round(452 - (452 * (100 - r["score"]) / 100))
    return r


@api.get("/trace")
async def trace(scenario: Optional[str] = None):
    level = scenario or await current_scenario()
    return agents.run_query("Can I go fishing tomorrow morning?", level)["trace"]


@api.get("/evidence")
async def evidence(scenario: Optional[str] = None):
    level = scenario or await current_scenario()
    ev = agents.run_query("Can I go fishing tomorrow morning?", level)["evidence"]
    return {"sources": ev["sources"], "conflict": ev["conflict"]}


@api.get("/plan")
async def plan():
    return SEED_PLAN


@api.get("/alerts")
async def alerts(scenario: Optional[str] = None):
    level = scenario or await current_scenario()
    rank = LEVEL_RANK.get(level, 1)
    return [a for a in (SEED_ALERTS_HIGH + SEED_ALERTS) if a["minLevel"] <= rank]


@api.get("/trip/active")
async def trip_active(scenario: Optional[str] = None):
    level = scenario or await current_scenario()
    c = agents.get_conditions(level)
    return {
        "zone": "Fishing Zone B", "started": "6:00 AM",
        "wind": c["wind"] + " ↑", "waves": c["waves"] + " ↑", "elapsed": "5h 15m",
        "geofence": "2.1 km from restricted zone boundary",
        "returnWindow": "Conditions expected to worsen after 3 PM — begin heading back by 2:15 PM.",
        "returnUpdated": "Updated 1 min ago", "alertCount": 2, "level": level,
    }


@api.post("/trip/end")
async def trip_end():
    summary = {"duration": "5h 15m", "distance": "9.4 km", "alerts": "2 advisories",
               "emergencies": "None",
               "note": "Trip ended by user. Conditions logged for post-trip forecast comparison."}
    trip = {"id": str(uuid.uuid4()), "zone": "Fishing Zone B", "badge": "SAFE", "tone": "green",
            "when": "Today · 6:00 AM – now · 5h 15m",
            "detail": "2 advisories, 0 emergencies · 9.4 km round trip", "summary": summary}
    await db.trips.insert_one(dict(trip))
    return {"ended": True, "summary": summary}


@api.get("/trips")
async def trips():
    docs = await db.trips.find().to_list(100)
    return [clean(d) for d in docs]


@api.get("/community/posts")
async def get_posts():
    docs = await db.community_posts.find().sort("_id", -1).to_list(200)
    return [clean(d) for d in docs]


@api.post("/community/posts")
async def add_post(body: PostIn):
    post = {"id": "c" + uuid.uuid4().hex[:8], "author": "Ramesh K.", "initials": "RK",
            "verified": True, "time": "just now", "mine": True, "helpful": 0,
            "text": body.text,
            "tag": "HAZARD · PENDING MODERATION" if body.kind == "hazard" else "PENDING MODERATION",
            "tagClass": "orange" if body.kind == "hazard" else "sim"}
    await db.community_posts.insert_one(dict(post))
    return clean(post)


@api.post("/community/posts/{post_id}/helpful")
async def helpful(post_id: str):
    doc = await db.community_posts.find_one({"id": post_id})
    if not doc:
        raise HTTPException(404, "post not found")
    if not doc.get("liked"):
        await db.community_posts.update_one({"id": post_id},
                                            {"$set": {"liked": True}, "$inc": {"helpful": 1}})
    return clean(await db.community_posts.find_one({"id": post_id}))


@api.post("/community/posts/{post_id}/report")
async def report_post(post_id: str, body: ReportIn):
    doc = await db.community_posts.find_one({"id": post_id})
    if not doc:
        raise HTTPException(404, "post not found")
    if not doc.get("reported"):
        await db.community_posts.update_one(
            {"id": post_id},
            {"$set": {"reported": True, "reportReason": body.reason,
                      "tag": "REPORTED · UNDER REVIEW", "tagClass": "orange"}},
        )
    return clean(await db.community_posts.find_one({"id": post_id}))


def _poll_view(p: dict) -> dict:
    total = sum(o["votes"] for o in p["options"]) or 1
    for o in p["options"]:
        o["pct"] = round(o["votes"] / total * 100)
    p["meta"] = f"{total} votes · expires in 3h"
    p["pollVoted"] = p.get("votedBy")
    return p


@api.get("/community/poll")
async def get_poll():
    return _poll_view(clean(await db.polls.find_one({"id": "poll1"})))


@api.post("/community/poll/vote")
async def vote(body: VoteIn):
    p = await db.polls.find_one({"id": "poll1"})
    if not p:
        raise HTTPException(404, "poll not found")
    if not p.get("votedBy"):
        for o in p["options"]:
            if o["id"] == body.optionId:
                o["votes"] += 1
        await db.polls.update_one({"id": "poll1"},
                                  {"$set": {"options": p["options"], "votedBy": body.optionId}})
        p = await db.polls.find_one({"id": "poll1"})
    return _poll_view(clean(p))


@api.post("/emergency/sos")
async def sos(body: SosIn):
    await db.app_state.update_one({"id": "state"}, {"$set": {"scenario": body.scenario}}, upsert=True)
    em = {"id": "em" + uuid.uuid4().hex[:8], "type": body.type, "people": body.people,
          "status": "HELP_REQUESTED", "position": "17.02°N, 73.28°E · captured 12:30 PM",
          "created": now_iso(),
          "timeline": [{"label": "SOS triggered", "value": "12:30 PM ✓"},
                       {"label": "Location captured", "value": "12:30 PM ✓"}],
          "rescue": {"unit": "Coast Guard Unit 4", "eta": "ETA 14 min", "status": "ASSIGNED",
                     "note": "Prototype simulation for demo purposes."}}
    await db.emergencies.insert_one(dict(em))
    return clean(em)


@api.get("/emergency/{em_id}")
async def get_emergency(em_id: str):
    doc = await db.emergencies.find_one({"id": em_id})
    if not doc:
        raise HTTPException(404, "emergency not found")
    return clean(doc)


@api.post("/emergency/{em_id}/cancel")
async def cancel_emergency(em_id: str):
    await db.emergencies.update_one({"id": em_id}, {"$set": {"status": "CANCELLED"}})
    return {"cancelled": True}


@api.get("/emergency/{em_id}/rescue")
async def rescue(em_id: str):
    doc = await db.emergencies.find_one({"id": em_id})
    if not doc:
        raise HTTPException(404, "emergency not found")
    return doc["rescue"]


@api.post("/emergency/{em_id}/contact-service")
async def contact_service(em_id: str):
    doc = await db.emergencies.find_one({"id": em_id})
    if not doc:
        raise HTTPException(404, "emergency not found")
    entry = {"label": "Emergency service contacted", "value": f"{now_clock()} ✓"}
    await db.emergencies.update_one({"id": em_id}, {"$push": {"timeline": entry}})
    return clean(await db.emergencies.find_one({"id": em_id}))


@api.post("/emergency/{em_id}/share-location")
async def share_location(em_id: str, body: ShareLocationIn):
    doc = await db.emergencies.find_one({"id": em_id})
    if not doc:
        raise HTTPException(404, "emergency not found")
    update = {}
    if body.lat is not None and body.lng is not None:
        update["position"] = f"{body.lat:.4f}°N, {body.lng:.4f}°E · captured {now_clock()}"
    entry = {"label": "Location shared with contacts", "value": f"{now_clock()} ✓"}
    push = {"$push": {"timeline": entry}}
    if update:
        push["$set"] = update
    await db.emergencies.update_one({"id": em_id}, push)
    return clean(await db.emergencies.find_one({"id": em_id}))


@api.post("/demo/scenario")
async def set_scenario(body: ScenarioIn):
    lvl = body.level.upper()
    if lvl not in agents.SCENARIOS:
        raise HTTPException(400, "invalid level")
    await db.app_state.update_one({"id": "state"}, {"$set": {"scenario": lvl}}, upsert=True)
    c = agents.get_conditions(lvl)
    return {"scenario": lvl, "conditions": {k: c[k] for k in (
        "level", "levelLabel", "wind", "waves", "alertsActive", "updated", "ribbon",
        "weather", "ocean")}}


@api.get("/profile")
async def get_profile():
    doc = await db.profiles.find_one({"id": "demo-user"})
    return clean(doc or dict(SEED_PROFILE))


@api.put("/profile")
async def update_profile(body: ProfileIn):
    upd = {k: v for k, v in body.dict().items() if v is not None}
    if upd:
        await db.profiles.update_one({"id": "demo-user"}, {"$set": upd}, upsert=True)
    return clean(await db.profiles.find_one({"id": "demo-user"}))


@api.get("/data-sources")
async def data_sources():
    return DATA_SOURCES


@api.get("/contacts")
async def get_contacts():
    docs = await db.contacts.find().to_list(100)
    return [clean(d) for d in docs]


@api.post("/contacts")
async def add_contact(body: ContactIn):
    contact = {"id": "ct" + uuid.uuid4().hex[:8], "name": body.name.strip(),
               "phone": body.phone.strip(), "role": body.role or "Contact"}
    await db.contacts.insert_one(dict(contact))
    return clean(contact)


@api.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    res = await db.contacts.delete_one({"id": contact_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "contact not found")
    return {"deleted": True}


app.include_router(api)

_cors_env = os.environ.get("CORS_ORIGINS", "*")
_cors_origins = ["*"] if _cors_env.strip() == "*" else [o.strip() for o in _cors_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware, allow_credentials=_cors_origins != ["*"], allow_origins=_cors_origins,
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
