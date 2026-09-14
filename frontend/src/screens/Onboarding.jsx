import React, { useState } from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { ChipRow } from "../components/Shared";
import { languages, vesselTypes } from "../mock";

export function Splash() {
  const { go, t } = useApp();
  return (
    <Screen id="splash">
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 50% 30%, #EAF4FB 0%, #FCFEFF 75%)", color: "var(--teal-deep)", textAlign: "center", padding: "0 30px" }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M8 40c8-14 16-14 24 0s16 14 24 0" stroke="#146FAE" strokeWidth="3" strokeLinecap="round" />
          <path d="M8 26c8-14 16-14 24 0s16 14 24 0" stroke="#F2A93B" strokeWidth="3" strokeLinecap="round" opacity=".85" />
        </svg>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, marginTop: 18, letterSpacing: "-.01em" }}>ORCA</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, maxWidth: 230, lineHeight: 1.5 }}>
          {t("splash_tagline")}
        </div>
        <button className="btn brass" style={{ marginTop: 38, maxWidth: 200 }} onClick={() => go("onboard1")}>{t("btn_begin")}</button>
        <div className="txt-xs" style={{ color: "var(--ink-faint)", marginTop: 14 }}>Problem Statement 26176 · ISRO</div>
      </div>
    </Screen>
  );
}

const onboardContent = {
  onboard1: {
    art: (
      <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
        <path d="M4 70c14-24 28-24 42 0s28 24 42 0 18-16 28-8" stroke="#146FAE" strokeWidth="4" strokeLinecap="round" />
        <circle cx="90" cy="30" r="14" fill="#FFF6E6" stroke="#F2A93B" strokeWidth="2" />
        <path d="M84 30h12M90 24v12" stroke="#F2A93B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Ask in plain language",
    text: "\"Can I go fishing tomorrow morning?\" — ORCA understands English, Hindi, and mixed regional speech.",
    step: 0,
    next: "onboard2",
    nextLabel: "Next",
  },
  onboard2: {
    art: (
      <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
        <circle cx="60" cy="45" r="8" fill="#146FAE" />
        <circle cx="60" cy="45" r="20" stroke="#146FAE" strokeWidth="2" opacity=".4" />
        <circle cx="60" cy="45" r="32" stroke="#146FAE" strokeWidth="2" opacity=".2" />
        <path d="M60 13v10M60 67v10M92 45H82M38 45H28" stroke="#F2A93B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Watched the whole trip",
    text: "Once you're at sea, ORCA keeps monitoring weather, waves and warnings — and alerts you the moment something changes.",
    step: 1,
    next: "onboard3",
    nextLabel: "Next",
  },
  onboard3: {
    art: (
      <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
        <path d="M55 6L14 78h82L55 6z" fill="#FDECEB" stroke="#EF5B57" strokeWidth="3" />
        <path d="M55 34v22M55 64v4" stroke="#EF5B57" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    title: "Help, when it matters",
    text: "One tap for SOS. Your location, vessel and situation are shared instantly — no repeating yourself under stress.",
    step: 2,
    next: "login",
    nextLabel: "Get started",
  },
};

export function Onboard({ id }) {
  const { go, t } = useApp();
  const art = onboardContent[id];
  const obKey = "ob" + id.slice(-1);
  const c = {
    title: t(obKey + "_title"),
    text: t(obKey + "_text"),
    step: art.step,
    next: art.next,
    nextLabel: id === "onboard3" ? t("btn_get_started") : t("btn_next"),
  };
  return (
    <Screen id={id}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 34px", textAlign: "center" }}>
          {art.art}
          <div className="h-title" style={{ marginTop: 22, fontSize: 19 }}>{c.title}</div>
          <div className="txt-sm" style={{ marginTop: 8 }}>{c.text}</div>
        </div>
        <div className="pad">
          <div className="dots" style={{ marginBottom: 18 }}>
            {[0, 1, 2].map((i) => <span key={i} className={i === c.step ? "on" : ""} />)}
          </div>
          <button className="btn primary" onClick={() => go(c.next)}>{c.nextLabel}</button>
          {id !== "onboard3" && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <span className="txt-xs" style={{ cursor: "pointer" }} onClick={() => go("login")}>{t("btn_skip")}</span>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}

export function Login() {
  const { go, profile, setProfile, saveProfile, setLanguage, t } = useApp();
  return (
    <Screen id="login">
      <div className="pad" style={{ paddingTop: 26 }}>
        <div className="h-title" style={{ fontSize: 21 }}>{t("login_title")}</div>
        <div className="txt-sm" style={{ marginTop: 6 }}>{t("login_sub")}</div>

        <div className="card section-gap">
          <div className="eyebrow-sm">{t("login_name")}</div>
          <input
            className="field"
            style={{ marginTop: 8 }}
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="card">
          <div className="eyebrow-sm">{t("login_language")}</div>
          <ChipRow
            style={{ marginTop: 8 }}
            options={languages.slice(0, 4)}
            active={profile.language}
            onChange={(v) => setLanguage(v)}
          />
        </div>
        <div className="card">
          <div className="eyebrow-sm">{t("login_vessel")}</div>
          <ChipRow
            style={{ marginTop: 8 }}
            options={vesselTypes}
            active={profile.vessel}
            onChange={(v) => setProfile((p) => ({ ...p, vessel: v }))}
          />
        </div>
        <div className="card">
          <div className="eyebrow-sm">{t("login_contact")}</div>
          <input
            className="field"
            style={{ marginTop: 8 }}
            value={profile.contact}
            onChange={(e) => setProfile((p) => ({ ...p, contact: e.target.value }))}
          />
          <div className="txt-xs" style={{ marginTop: 8 }}>Used only if you trigger SOS or ORCA detects an unresolved emergency.</div>
        </div>
        <div className="card">
          <div className="row">
            <div className="col">
              <span className="eyebrow-sm">{t("login_homeport")}</span>
              <span className="txt-sm">{profile.homePort}</span>
            </div>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </div>
        </div>
        <button className="btn primary section-gap" onClick={() => { saveProfile(profile); go("home"); }}>{t("btn_continue")}</button>
      </div>
    </Screen>
  );
}
