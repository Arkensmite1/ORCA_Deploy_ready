import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

const client = axios.create({ baseURL: BASE, timeout: 12000 });

// Each call resolves to data or `null` on failure so the UI can fall back to mock.
async function safe(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (e) {
    console.warn("[orca api]", e?.message || e);
    return null;
  }
}

export const api = {
  conditions: (scenario) => safe(client.get("/conditions", { params: { scenario } })),
  query: (text, scenario) => safe(client.post("/query", { text, scenario })),
  risk: (scenario) => safe(client.get("/risk", { params: { scenario } })),
  trace: (scenario) => safe(client.get("/trace", { params: { scenario } })),
  evidence: (scenario) => safe(client.get("/evidence", { params: { scenario } })),
  plan: () => safe(client.get("/plan")),
  alerts: (scenario) => safe(client.get("/alerts", { params: { scenario } })),
  tripActive: (scenario) => safe(client.get("/trip/active", { params: { scenario } })),
  tripEnd: () => safe(client.post("/trip/end")),
  trips: () => safe(client.get("/trips")),
  posts: () => safe(client.get("/community/posts")),
  addPost: (text, kind) => safe(client.post("/community/posts", { text, kind })),
  helpful: (id) => safe(client.post(`/community/posts/${id}/helpful`)),
  poll: () => safe(client.get("/community/poll")),
  vote: (optionId) => safe(client.post("/community/poll/vote", { optionId })),
  sos: (type, people, scenario) => safe(client.post("/emergency/sos", { type, people, scenario })),
  emergency: (id) => safe(client.get(`/emergency/${id}`)),
  cancelEmergency: (id) => safe(client.post(`/emergency/${id}/cancel`)),
  rescue: (id) => safe(client.get(`/emergency/${id}/rescue`)),
  contactService: (id) => safe(client.post(`/emergency/${id}/contact-service`)),
  shareLocation: (id, lat, lng) => safe(client.post(`/emergency/${id}/share-location`, { lat, lng })),
  setScenario: (level) => safe(client.post("/demo/scenario", { level })),
  profile: () => safe(client.get("/profile")),
  saveProfile: (p) => safe(client.put("/profile", p)),
  dataSources: () => safe(client.get("/data-sources")),
  contacts: () => safe(client.get("/contacts")),
  addContact: (name, phone, role) => safe(client.post("/contacts", { name, phone, role })),
  deleteContact: (id) => safe(client.delete(`/contacts/${id}`)),
  reportPost: (id, reason) => safe(client.post(`/community/posts/${id}/report`, { reason })),
};

export default api;
