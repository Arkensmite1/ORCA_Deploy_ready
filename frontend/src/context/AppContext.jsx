import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { chatSeed, mockOrcaReply, agentSteps, communityPostsSeed, pollSeed, scenarioConditions,
  emergencyContacts as emergencyContactsSeed, emergencyInfo } from "../mock";
import api from "../api";
import { translations, LANG_CODE } from "../i18n";
import { toast } from "../components/ui/sonner";

const AppContext = createContext(null);

const navMap = {
  home: "home", chat: "home", map: "map", trip: "home", plan: "plan",
  alerts: "home", community: "community", emergency: null, rescue: null,
  history: "profile", profile: "profile", settings: "profile",
  risk: "home", trace: "home", geofence: null, sosconfirm: null, demo: "profile",
};
const noChromeScreens = ["landing", "splash", "onboard1", "onboard2", "onboard3", "login", "sosconfirm"];
const noFabScreens = ["emergency", "rescue", "geofence"];

export function AppProvider({ children }) {
  const [screen, setScreen] = useState("landing");
  const [sheet, setSheet] = useState(null);
  const [scenario, setScenario] = useState("YELLOW");
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  // backend-backed state (fall back to mock values so UI never looks hollow)
  const [conditions, setConditions] = useState(scenarioConditions.YELLOW);
  const [posts, setPosts] = useState(communityPostsSeed);
  const [poll, setPoll] = useState({ ...pollSeed, options: pollSeed.options });
  const [pollVoted, setPollVoted] = useState(null);
  const [emergencyId, setEmergencyId] = useState(null);

  const [messages, setMessages] = useState(chatSeed);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const stepTimer = useRef(null);

  const [settings, setSettings] = useState({
    push: true, voice: true, shareLocation: false, offline: false,
    units: "metric", language: "English",
    alertInfo: false, alertAdvisory: true, alertWarning: true, alertCritical: true,
  });

  const [profile, setProfile] = useState({
    name: "Ramesh Koli", language: "English", vessel: "Small motorboat",
    contact: "+91 98••• ••452 · Wife", homePort: "Ratnagiri Harbour",
  });

  const [sosType, setSosType] = useState("Engine failure");
  const [summaryTrip, setSummaryTrip] = useState(null);

  const [contacts, setContacts] = useState(emergencyContactsSeed.map((c, i) => ({ id: "seed" + i, ...c })));
  const [emergency, setEmergency] = useState(emergencyInfo);

  // ---- load conditions + community whenever scenario changes ----
  useEffect(() => {
    let alive = true;
    (async () => {
      const c = await api.conditions(scenario);
      if (alive && c) setConditions(c);
    })();
    return () => { alive = false; };
  }, [scenario]);

  useEffect(() => {
    (async () => {
      const [p, pl] = [await api.posts(), await api.poll()];
      if (p) setPosts(p);
      if (pl) { setPoll(pl); if (pl.pollVoted) setPollVoted(pl.pollVoted); }
      const prof = await api.profile();
      if (prof) {
        setProfile((cur) => ({ ...cur, ...prof }));
        if (prof.language) setSettings((s) => ({ ...s, language: prof.language }));
      }
      const cts = await api.contacts();
      if (cts && cts.length) setContacts(cts);
    })();
  }, []);

  const go = useCallback((name) => { setSheet(null); setScreen(name); }, []);

  const toggleSheet = useCallback((id, show) => {
    setSheet((cur) => (show === undefined ? (cur === id ? null : id) : show ? id : null));
  }, []);

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed || agentBusy) return;
    setMessages((m) => [...m, { from: "user", text: trimmed }]);
    setAgentBusy(true);
    setAgentStep(0);

    // kick off the real backend query in parallel with the trace animation
    const queryPromise = api.query(trimmed, scenario);
    let step = 0;
    stepTimer.current = setInterval(async () => {
      step += 1;
      if (step < agentSteps.length) {
        setAgentStep(step);
      } else {
        clearInterval(stepTimer.current);
        stepTimer.current = null;
        const res = await queryPromise;
        setAgentBusy(false);
        if (res && res.answer) setMessages((m) => [...m, { from: "orca", ...res.answer }]);
        else setMessages((m) => [...m, mockOrcaReply(trimmed)]);
      }
    }, 420);
  }, [agentBusy, scenario]);

  const addPost = useCallback(async (text, kind) => {
    if (!text.trim()) return;
    const created = await api.addPost(text.trim(), kind);
    if (created) setPosts((p) => [created, ...p]);
    else setPosts((p) => [{ id: "c" + Date.now(), author: "Ramesh K.", initials: "RK",
      verified: true, time: "just now", tag: "PENDING MODERATION", tagClass: "sim",
      text: text.trim(), helpful: 0, mine: true }, ...p]);
  }, []);

  const votePoll = useCallback(async (optId) => {
    if (pollVoted) return;
    setPollVoted(optId);
    const updated = await api.vote(optId);
    if (updated) setPoll(updated);
    else setPoll((p) => {
      const total = p.options.reduce((s, o) => s + o.votes, 0) + 1;
      return { ...p, meta: `${total} votes · expires in 3h`,
        options: p.options.map((o) => {
          const votes = o.id === optId ? o.votes + 1 : o.votes;
          return { ...o, votes, pct: Math.round((votes / total) * 100) };
        }) };
    });
  }, [pollVoted]);

  const markHelpful = useCallback(async (postId) => {
    const updated = await api.helpful(postId);
    if (updated) setPosts((p) => p.map((x) => (x.id === postId ? updated : x)));
    else setPosts((p) => p.map((x) => (x.id === postId && !x.liked
      ? { ...x, helpful: x.helpful + 1, liked: true } : x)));
  }, []);

  const runScenario = useCallback(async (sc) => {
    setSelectedScenarioId(sc.id);
    setScenario(sc.level);
    await api.setScenario(sc.level);
    if (sc.target === "summary") {
      const trips = await api.trips();
      if (trips && trips.length) setSummaryTrip(trips.find((t) => t.summary) || trips[0]);
      go("history");
      setTimeout(() => setSheet("summary"), 250);
      return;
    }
    go(sc.target);
  }, [go]);

  const triggerSos = useCallback(async () => {
    setScenario("RED");
    const em = await api.sos(sosType, 3, "RED");
    if (em) { setEmergencyId(em.id); setEmergency(em); }
    else setEmergency((e) => ({ ...e, type: sosType }));
  }, [sosType]);

  const cancelSos = useCallback(async () => {
    if (emergencyId) await api.cancelEmergency(emergencyId);
    setScenario("YELLOW");
    await api.setScenario("YELLOW");
  }, [emergencyId]);

  const contactEmergencyService = useCallback(async () => {
    const num = "+91-1554-222080"; // Ratnagiri Coast Guard — demo number
    if (emergencyId) {
      const updated = await api.contactService(emergencyId);
      if (updated) setEmergency(updated);
      else setEmergency((e) => ({ ...e, timeline: [...(e.timeline || []),
        { label: "Emergency service contacted", value: "just now ✓" }] }));
    }
    toast.success("Calling emergency services…", { description: num });
    window.location.href = `tel:${num}`;
  }, [emergencyId]);

  const shareLocation = useCallback(async () => {
    const applyShare = async (lat, lng) => {
      if (emergencyId) {
        const updated = await api.shareLocation(emergencyId, lat, lng);
        if (updated) setEmergency(updated);
        else setEmergency((e) => ({ ...e, timeline: [...(e.timeline || []),
          { label: "Location shared with contacts", value: "just now ✓" }] }));
      }
      const text = lat != null
        ? `My live location: https://maps.google.com/?q=${lat},${lng}`
        : "Sharing my last known location via ORCA.";
      if (navigator.share) {
        try { await navigator.share({ title: "ORCA — my location", text }); return; } catch { /* user cancelled */ }
      }
      if (navigator.clipboard) {
        try { await navigator.clipboard.writeText(text); toast.success("Location copied to clipboard", { description: text }); return; } catch { /* ignore */ }
      }
      toast.success("Location shared with your contacts");
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyShare(pos.coords.latitude, pos.coords.longitude),
        () => applyShare(17.02, 73.28), // fall back to demo Ratnagiri coordinates
        { timeout: 4000 },
      );
    } else {
      applyShare(17.02, 73.28);
    }
  }, [emergencyId]);

  const loadContacts = useCallback(async () => {
    const cts = await api.contacts();
    if (cts) setContacts(cts);
  }, []);

  const addContact = useCallback(async (name, phone, role) => {
    if (!name.trim() || !phone.trim()) return;
    const created = await api.addContact(name.trim(), phone.trim(), role || "Contact");
    if (created) setContacts((c) => [...c, created]);
    else setContacts((c) => [...c, { id: "local" + Date.now(), name: name.trim(), phone: phone.trim(), role: role || "Contact" }]);
    toast.success("Contact added");
  }, []);

  const deleteContact = useCallback(async (id) => {
    setContacts((c) => c.filter((x) => x.id !== id));
    await api.deleteContact(id);
  }, []);

  const callContact = useCallback((phone, name) => {
    toast.success(`Calling ${name || "contact"}…`, { description: phone });
    window.location.href = `tel:${phone.replace(/[^+\d]/g, "")}`;
  }, []);

  const reportPost = useCallback(async (postId) => {
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, tag: "REPORTED · UNDER REVIEW", tagClass: "orange", reported: true } : x)));
    toast.success("Post reported to moderators");
    await api.reportPost(postId, "inappropriate");
  }, []);

  const endTrip = useCallback(async () => {
    const res = await api.tripEnd();
    if (res?.summary) setSummaryTrip({ zone: "Fishing Zone B", summary: res.summary });
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  // ---- i18n ----
  const langCode = LANG_CODE[settings.language] || "en";
  const t = useCallback((key) => {
    const dict = translations[langCode] || translations.en;
    return dict[key] || translations.en[key] || key;
  }, [langCode]);

  const setLanguage = useCallback((displayName) => {
    setSettings((s) => ({ ...s, language: displayName }));
    setProfile((p) => ({ ...p, language: displayName }));
    api.saveProfile({ language: displayName });
  }, []);

  const saveProfile = useCallback(async (p) => {
    const saved = await api.saveProfile(p);
    if (saved) setProfile((cur) => ({ ...cur, ...saved }));
  }, []);

  const value = useMemo(() => ({
    screen, go, navMap, noChromeScreens, noFabScreens,
    sheet, toggleSheet,
    scenario, selectedScenarioId, runScenario, conditions,
    messages, agentBusy, agentStep, sendMessage, setMessages,
    posts, addPost, markHelpful, reportPost, poll, pollVoted, votePoll,
    settings, updateSetting,
    profile, setProfile, saveProfile,
    t, langCode, setLanguage,
    sosType, setSosType, triggerSos, cancelSos, emergencyId, emergency,
    contactEmergencyService, shareLocation,
    contacts, loadContacts, addContact, deleteContact, callContact,
    summaryTrip, setSummaryTrip, endTrip,
  }), [screen, go, sheet, toggleSheet, scenario, selectedScenarioId, runScenario, conditions,
       messages, agentBusy, agentStep, sendMessage, posts, addPost, markHelpful, reportPost, poll,
       pollVoted, votePoll, settings, updateSetting, profile, saveProfile, sosType,
       triggerSos, cancelSos, emergencyId, emergency, contactEmergencyService, shareLocation,
       contacts, loadContacts, addContact, deleteContact, callContact,
       summaryTrip, endTrip, t, langCode, setLanguage]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
