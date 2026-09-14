// ============================================================
// ORCA prototype — MOCK / SEEDED DATA
// All values below are simulated for the demo (tagged REAL/SIM in UI).
// This module is the single place later replaced by backend API calls.
// ============================================================

export const userProfile = {
  name: "Ramesh Koli",
  initials: "RK",
  firstName: "Ramesh",
  language: "English",
  vessel: "Small motorboat",
  homePort: "Ratnagiri Harbour",
  emergencyContact: "+91 98••• ••452 · Wife",
  coast: "Ratnagiri coast",
};

export const languages = ["English", "हिंदी", "मराठी", "தமிழ்", "বাংলা"];
export const vesselTypes = ["Small motorboat", "Trawler", "Catamaran"];

// Live-ish marine conditions (driven by demo scenario state)
export const scenarioConditions = {
  GREEN: {
    level: "GREEN",
    levelLabel: "Low risk",
    wind: "12 km/h",
    waves: "0.9 m",
    alertsActive: 0,
    updated: "Updated 1 min ago",
    ribbon: "Demo mode · simulated conditions for Ratnagiri coast",
  },
  YELLOW: {
    level: "YELLOW",
    levelLabel: "Moderate risk",
    wind: "18 km/h",
    waves: "1.4 m",
    alertsActive: 1,
    updated: "Updated 4 min ago",
    ribbon: "Demo mode · simulated conditions for Ratnagiri coast",
  },
  ORANGE: {
    level: "ORANGE",
    levelLabel: "High risk — caution",
    wind: "34 km/h",
    waves: "2.6 m",
    alertsActive: 3,
    updated: "Updated just now",
    ribbon: "Demo mode · severe weather bulletin active (simulated)",
  },
  RED: {
    level: "RED",
    levelLabel: "Critical — emergency",
    wind: "52 km/h",
    waves: "3.8 m",
    alertsActive: 4,
    updated: "Updated just now",
    ribbon: "Demo mode · emergency scenario active (simulated)",
  },
};

export const activeTrip = {
  zone: "Fishing Zone B",
  started: "6:00 AM",
  wind: "27 km/h ↑",
  waves: "1.9 m ↑",
  elapsed: "5h 15m",
  geofence: "2.1 km from restricted zone boundary",
  returnWindow:
    "Conditions expected to worsen after 3 PM — begin heading back by 2:15 PM.",
  returnUpdated: "Updated 1 min ago",
  alertCount: 2,
};

export const riskAssessment = {
  level: "GREEN",
  score: 18,
  dialOffset: 345, // stroke-dashoffset of 452 circumference
  recommendation: "Recommended: Go",
  confidence: "0.91",
  updated: "10:42",
  why: [
    "Wind conditions favourable (18 km/h)",
    "Wave height within acceptable range (1.4 m)",
    "No active severe marine warning",
    "Return window remains favourable until 3 PM",
  ],
  weather: "Clear, 29°C",
  ocean: "1.4m swell",
  returnWindow: "Deteriorates after 3 PM — plan to return before then.",
};

export const explainPoints = [
  "Wave height is within the safe range for your vessel type.",
  "Wind conditions are favourable and expected to stay that way through the morning.",
  "No official marine advisory is currently active for this area.",
  "Your planned return time falls before the forecast deterioration window.",
];

export const evidenceSources = [
  { name: "Weather Agent", tag: "REAL", detail: "IMD gridded forecast · observed 10:38 AM · confidence 0.91" },
  { name: "Ocean Agent", tag: "SIM", detail: "Seeded wave/swell dataset · observed 10:30 AM · confidence 0.84" },
  { name: "Marine Warnings", tag: "REAL", detail: "No active bulletin · checked 10:40 AM" },
  { name: "Satellite Agent", tag: "SIM", detail: "Sample SST/chlorophyll product · observed 9:50 AM · confidence 0.72" },
];

export const sourceConflict = {
  title: "Source conflict detected",
  a: "Wind source A: 18 km/h",
  b: "Wind source B: 27 km/h",
  resolution:
    "ORCA used the higher, fresher, official-authority reading (27 km/h) rather than averaging — the conservative value drives the risk score.",
};

export const agentTrace = [
  {
    name: "Planner / Orchestrator",
    time: "4 ms",
    color: "var(--teal)",
    detail: "Intent: SAFETY_QUERY · Entities: time=tomorrow AM · Dispatches 7 agents in parallel",
  },
  {
    name: "Context Agent",
    time: "6 ms",
    color: "var(--brass)",
    detail: "Resolved: Ratnagiri coast · vessel=small motorboat · no active trip",
  },
  {
    name: "Weather + Ocean + Geospatial + Satellite + Tide",
    time: "PARALLEL",
    color: "var(--teal)",
    detail: "5 tool calls fired concurrently · slowest 340 ms (Satellite/SIM) · 1 conflict flagged (wind speed A vs B)",
    parallel: true,
  },
  {
    name: "Evidence Agent",
    time: "11 ms",
    color: "var(--brass)",
    detail: "Ranked sources by authority + freshness · resolved wind conflict conservatively → 27 km/h used",
  },
  {
    name: "Risk Agent",
    time: "deterministic",
    color: "var(--orange)",
    detail: "risk_score=18 · risk_level=GREEN · reassess_when=[new_bulletin, wind_delta>10kmh]",
  },
  {
    name: "Response Generator (LLM)",
    time: "explain-only",
    color: "var(--teal)",
    detail: "Summarizes structured output in plain English/Hindi — cannot alter risk_level or invent figures",
  },
];

export const planDays = [
  { day: 1, label: "Day 1 · Tomorrow", badge: "GO", tone: "green", text: "Fishing window 6:00 AM – 2:00 PM · Zone B", sub: "Return before 3:00 PM deterioration window" },
  { day: 2, label: "Day 2", badge: "GO", tone: "green", text: "No significant risk currently forecast. ORCA will reassess closer to the date." },
  { day: 3, label: "Day 3", badge: "RECONSIDER", tone: "orange", text: "Conditions have changed since this plan was made. Consider postponing or moving to Zone D.", changed: true },
  { day: 4, label: "Day 4", badge: "GO", tone: "green", text: "No significant risk currently forecast. ORCA will reassess closer to the date." },
  { day: 5, label: "Day 5", badge: "GO", tone: "green", text: "No significant risk currently forecast. ORCA will reassess closer to the date." },
  { day: 6, label: "Day 6", badge: "WATCH", tone: "yellow", text: "Swell forecast trending upward — ORCA will reassess tonight and notify you if the window shifts." },
  { day: 7, label: "Day 7", badge: "GO", tone: "green", text: "No significant risk currently forecast. ORCA will reassess closer to the date." },
];

export const alertsFeed = [
  {
    id: "a1",
    tone: "orange",
    badge: "WARNING",
    time: "12:00 PM",
    title: "Marine conditions deteriorating near your route",
    sub: "Wind and wave conditions rising · tap to view trip",
    link: "trip",
  },
  {
    id: "a2",
    tone: "yellow",
    badge: "ADVISORY",
    time: "11:15 AM",
    title: "Wind speed trending upward (grouped: 4 updates)",
  },
  {
    id: "a3",
    tone: "teal",
    badge: "INFO",
    time: "9:32 AM",
    title: "Trip started — Fishing Zone B",
    sub: "Acknowledged",
    faded: true,
  },
];

export const communityPostsSeed = [
  {
    id: "c1",
    author: "Suresh P.",
    initials: "SP",
    verified: true,
    time: "12 min ago",
    tag: "TRUSTED",
    tagClass: "green",
    text: "Waves picking up near Zone B, came in early. Sky looks clear otherwise.",
    helpful: 14,
  },
  {
    id: "c2",
    author: "Anil K.",
    initials: "AK",
    verified: false,
    time: "40 min ago",
    tag: "OBSERVATION",
    tagClass: "sim",
    text: "Good catch near the harbour mouth this morning.",
    helpful: 6,
  },
];

export const pollSeed = {
  question: "How are sea conditions near Zone B right now?",
  meta: "42 votes · expires in 3h",
  options: [
    { id: "calm", label: "Calm", votes: 8, pct: 18, tint: "var(--surface-alt)" },
    { id: "moderate", label: "Moderate", votes: 23, pct: 55, tint: "var(--yellow-tint)" },
    { id: "rough", label: "Rough", votes: 11, pct: 27, tint: "var(--orange-tint)" },
  ],
};

export const tripHistory = [
  {
    id: "t1",
    zone: "Fishing Zone B",
    badge: "SAFE",
    tone: "green",
    when: "Yesterday · 6:00 AM – 2:40 PM · 8h 40m",
    detail: "2 advisories, 0 emergencies · 14.2 km round trip",
    summary: {
      duration: "8h 40m",
      distance: "14.2 km",
      alerts: "2 advisories",
      emergencies: "None",
      note: "Conditions stayed within forecast for most of the trip. Wind rose earlier than predicted around 1 PM — logged for future forecast comparison.",
    },
  },
  {
    id: "t2",
    zone: "Fishing Zone A",
    badge: "1 WARNING",
    tone: "orange",
    when: "3 days ago · 5:30 AM – 1:10 PM · 7h 40m",
    detail: "Wind advisory at 11:15 AM · returned safely",
  },
  {
    id: "t3",
    zone: "Fishing Zone C",
    badge: "SAFE",
    tone: "green",
    when: "6 days ago · 6:15 AM – 12:50 PM · 6h 35m",
  },
];

export const safeLocations = [
  { name: "Ratnagiri Harbour", tag: "VERIFIED", detail: "4.2 km · ~22 min · Port authority facility" },
  { name: "Ganpatipule Shelter Point", tag: "VERIFIED", detail: "7.8 km · ~38 min · Designated emergency shelter" },
];

export const emergencyInfo = {
  position: "17.02°N, 73.28°E · captured 12:30 PM",
  people: "3",
  type: "Engine failure",
  timeline: [
    { label: "SOS triggered", value: "12:30 PM ✓" },
    { label: "Location captured", value: "12:30 PM ✓" },
  ],
  rescue: {
    unit: "Coast Guard Unit 4",
    eta: "ETA 14 min",
    status: "ASSIGNED",
    note: "Prototype simulation for demo purposes.",
  },
};

export const emergencyTypes = [
  "Engine failure",
  "Medical",
  "Flooding / capsizing",
  "Person overboard",
  "Lost / immobilized",
  "Not sure / other",
];

export const emergencyContacts = [
  { name: "Wife — Sunita Koli", role: "Primary", phone: "+91 98••• ••452" },
  { name: "Ratnagiri Coastal Police", role: "Authority", phone: "+91 23••• ••100" },
];

export const dataSources = [
  { name: "Weather", tag: "REAL", detail: "IMD gridded API" },
  { name: "Ocean / waves", tag: "SIM", detail: "Seeded sample dataset" },
  { name: "Satellite (SST/chlorophyll)", tag: "SIM", detail: "Prototype dataset" },
  { name: "Marine warnings", tag: "REAL", detail: "Official bulletin feed" },
  { name: "Rescue integration", tag: "SIM", detail: "Simulated — pending agency integration" },
];

export const demoScenarios = [
  { id: 1, title: "Normal conditions", level: "GREEN", target: "home" },
  { id: 2, title: "Weather deteriorating", level: "YELLOW", target: "trip" },
  { id: 3, title: "Cyclone bulletin issued", level: "ORANGE", target: "alerts" },
  { id: 4, title: "Geofence proximity", level: "ORANGE", target: "geofence" },
  { id: 5, title: "SOS triggered", level: "RED", target: "sosconfirm" },
  { id: 6, title: "Rescue simulation", level: "RED", target: "rescue" },
  { id: 7, title: "Safe — recovered", level: "GREEN", target: "summary" },
];

// ---------------- Ask ORCA — mock grounded responder ----------------
// Frontend-only intent matcher standing in for the orchestrator pipeline.
// In the full-stack build this is replaced by POST /api/query.
export const chatSeed = [
  { from: "user", text: "Can I go fishing tomorrow morning?" },
  {
    from: "orca",
    kind: "risk-card",
    badge: "LOW RISK",
    tone: "green",
    title: "Recommended: Go",
    bullets: [
      "Wind favourable, waves in range",
      "No active marine warning",
      "Return window stays favourable",
    ],
    watch: "Watch: conditions may shift after 3 PM",
    updated: "Updated 10:42 AM",
  },
  { from: "user", text: "What about the afternoon?" },
  { from: "orca", kind: "note", text: "ORCA remembers your location and trip context — no need to repeat it." },
  {
    from: "orca",
    kind: "simple",
    badge: "MODERATE — WATCH",
    tone: "yellow",
    text: "Afternoon wind is forecast to rise past 3 PM and a return-window risk opens up after 4 PM. If you go, plan to be back before then.",
  },
  { from: "user", text: "Kal subah 6 baje jana thik hai kya?" },
  {
    from: "orca",
    kind: "simple",
    langTag: "हिंदी detected",
    text: "हां, कल सुबह 6 बजे जाना सुरक्षित है — हवा और लहरें सामान्य सीमा में हैं। दोपहर 3 बजे के बाद मौसम बदल सकता है, उससे पहले लौट आएं।",
  },
];

export const agentSteps = [
  "Context Agent → resolving Ratnagiri coast",
  "Weather + Ocean + Satellite → 5 tool calls (parallel)",
  "Evidence Agent → verifying sources & freshness",
  "Risk Agent → deterministic scoring",
  "Response Generator → explaining (no invented figures)",
];

export function mockOrcaReply(raw) {
  const q = raw.toLowerCase();
  const hindi = /kal|baje|jana|thik|hai|kya|surakshit|machli/.test(q) || /[\u0900-\u097F]/.test(raw);
  if (hindi) {
    return {
      from: "orca",
      kind: "simple",
      langTag: "हिंदी detected",
      text: "हां, कल सुबह 6 बजे जाना सुरक्षित है — हवा और लहरें सामान्य सीमा में हैं। दोपहर 3 बजे के बाद मौसम बदल सकता है, उससे पहले लौट आएं।\n\n(Yes — tomorrow 6 AM looks safe; wind and waves are within normal range. Return before conditions shift after 3 PM.)",
    };
  }
  if (q.includes("afternoon") || q.includes("evening") || q.includes("later")) {
    return {
      from: "orca",
      kind: "simple",
      badge: "MODERATE — WATCH",
      tone: "yellow",
      text: "Afternoon wind is forecast to rise past 3 PM and a return-window risk opens up after 4 PM. If you go, plan to be back before then.",
    };
  }
  if (q.includes("cyclone") || q.includes("storm") || q.includes("warning")) {
    return {
      from: "orca",
      kind: "simple",
      badge: "NO ACTIVE CYCLONE BULLETIN",
      tone: "green",
      text: "No cyclone or severe-weather bulletin is currently active for the Ratnagiri coast (checked 10:40 AM, official feed). ORCA re-checks every 15 minutes and will alert you immediately if one is issued.",
    };
  }
  if (q.includes("route") || q.includes("safe area") || q.includes("shelter") || q.includes("zone")) {
    return {
      from: "orca",
      kind: "simple",
      badge: "ROUTE",
      tone: "teal",
      text: "Best route today: harbour mouth → Zone B corridor, keeping 2+ km clear of the restricted boundary to the north-east. Nearest verified shelter is Ratnagiri Harbour (4.2 km, ~22 min). Open the Map for the live layer view.",
    };
  }
  if (q.includes("plan") || q.includes("week") || q.includes("7-day") || q.includes("7 day")) {
    return {
      from: "orca",
      kind: "simple",
      badge: "7-DAY PLAN",
      tone: "teal",
      text: "Your 7-day plan: Days 1–2 GO, Day 3 needs reconsideration (conditions changed — consider Zone D), Days 4–7 currently favourable. The plan re-assesses automatically as new data arrives.",
    };
  }
  // default: tomorrow-morning style safety query
  return {
    from: "orca",
    kind: "risk-card",
    badge: "LOW RISK",
    tone: "green",
    title: "Recommended: Go",
    bullets: [
      "Wind favourable, waves in range",
      "No active marine warning",
      "Return window stays favourable",
    ],
    watch: "Watch: conditions may shift after 3 PM",
    updated: "Updated just now",
  };
}

export const quickChipsHome = ["Safe areas near me", "Any cyclone alert?", "Best route today"];
export const quickChipsPlan = ["Move Day 3 to Zone D", "Any cyclone alert?", "Safer return time?"];

export const mapLayers = ["Route", "PFZ", "Waves", "Wind", "Geofence", "SST"];
