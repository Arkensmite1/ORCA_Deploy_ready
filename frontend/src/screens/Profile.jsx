import React from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Badge, ChipRow, Icon, Segment, Tag, Toggle, TopBar } from "../components/Shared";
import { demoScenarios, languages, tripHistory, userProfile } from "../mock";

export function History() {
  const { toggleSheet, setSummaryTrip, t } = useApp();
  return (
    <Screen id="history">
      <TopBar title={t("title_history")} />
      <div className="pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tripHistory.map((t) => (
          <div
            className="card"
            key={t.id}
            style={{ cursor: t.summary ? "pointer" : "default" }}
            onClick={() => { if (t.summary) { setSummaryTrip(t); toggleSheet("summary", true); } }}
          >
            <div className="row">
              <span className="h-title" style={{ fontSize: 14 }}>{t.zone}</span>
              <Badge tone={t.tone}>{t.badge}</Badge>
            </div>
            <div className="txt-xs" style={{ marginTop: 5 }}>{t.when}</div>
            {t.detail && <div className="txt-sm" style={{ marginTop: 6 }}>{t.detail}</div>}
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function Profile() {
  const { go, toggleSheet, profile, t } = useApp();
  const items = [
    { label: t("profile_history"), act: () => go("history") },
    { label: t("profile_posts"), act: () => go("community") },
    { label: t("profile_contacts"), act: () => toggleSheet("contacts", true) },
    { label: t("profile_settings"), act: () => go("settings") },
    { label: t("profile_datasrc"), act: () => toggleSheet("datasrc", true) },
  ];
  return (
    <Screen id="profile">
      <TopBar title={t("title_profile")} />
      <div className="pad">
        <div className="row" style={{ gap: 12, justifyContent: "flex-start" }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 17 }}>RK</div>
          <div className="col">
            <span className="h-title" style={{ fontSize: 16 }}>{profile.name || userProfile.name}</span>
            <span className="txt-xs">{profile.homePort} · {profile.vessel}</span>
          </div>
        </div>
        {items.map((it, i) => (
          <div className={`card ${i === 0 ? "section-gap" : ""}`} style={{ cursor: "pointer" }} key={it.label} onClick={it.act}>
            <div className="row">
              <span className="txt-sm" style={{ fontWeight: 600, color: "var(--ink)" }}>{it.label}</span>
              <Icon.chevron />
            </div>
          </div>
        ))}
        <button className="btn ghost-red section-gap" onClick={() => go("splash")}>{t("btn_logout")}</button>
      </div>
    </Screen>
  );
}

export function Settings() {
  const { go, settings, updateSetting, setLanguage, t } = useApp();
  return (
    <Screen id="settings">
      <TopBar title={t("title_settings")} onBack={() => go("profile")} />
      <div className="pad">
        <div className="eyebrow-sm">{t("set_language")}</div>
        <ChipRow
          style={{ marginTop: 8 }}
          options={languages}
          active={settings.language}
          onChange={(v) => setLanguage(v)}
        />
        <div className="txt-xs" style={{ marginTop: 8 }}>UI switches instantly — ask ORCA in your language too.</div>
        <div className="hr"></div>
        <div className="row"><span className="txt-sm" style={{ fontWeight: 600, color: "var(--ink)" }}>{t("set_push")}</span><Toggle on={settings.push} onToggle={(v) => updateSetting("push", v)} /></div>
        <div className="row section-gap"><span className="txt-sm" style={{ fontWeight: 600, color: "var(--ink)" }}>{t("set_voice")}</span><Toggle on={settings.voice} onToggle={(v) => updateSetting("voice", v)} /></div>
        <div className="row section-gap"><span className="txt-sm" style={{ fontWeight: 600, color: "var(--ink)" }}>{t("set_share_location")}</span><Toggle on={settings.shareLocation} onToggle={(v) => updateSetting("shareLocation", v)} /></div>
        <div className="row section-gap"><span className="txt-sm" style={{ fontWeight: 600, color: "var(--ink)" }}>{t("set_offline")}</span><Toggle on={settings.offline} onToggle={(v) => updateSetting("offline", v)} /></div>
        <div className="hr"></div>
        <div className="eyebrow-sm">{t("set_units")}</div>
        <div style={{ marginTop: 8 }}>
          <Segment
            options={[{ value: "metric", label: t("set_metric") }, { value: "imperial", label: t("set_imperial") }]}
            active={settings.units}
            onChange={(v) => updateSetting("units", v)}
          />
        </div>
        <div className="hr"></div>
        <div className="card"><div className="txt-xs">APP V1.0 · PS-26176 · ISRO</div></div>
        <button className="btn ghost section-gap" onClick={() => go("demo")}>{t("set_open_demo")}</button>
      </div>
    </Screen>
  );
}

export function Demo() {
  const { go, runScenario, selectedScenarioId, t } = useApp();
  return (
    <Screen id="demo">
      <TopBar title={t("title_demo")} onBack={() => go("profile")} right={<Tag kind="sim">SIM</Tag>} />
      <div className="pad">
        <div className="txt-xs" style={{ lineHeight: 1.6 }}>
          Drives the real event pipeline with seeded data — the same monitoring loop, risk engine and alerting used in
          production, just fed a scripted timeline instead of live feeds.
        </div>
        <div className="section-gap" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {demoScenarios.map((sc) => (
            <div
              className={`card scenario-card ${selectedScenarioId === sc.id ? "selected" : ""}`}
              style={{ cursor: "pointer", marginTop: 0 }}
              key={sc.id}
              onClick={() => runScenario(sc)}
            >
              <div className="row">
                <span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{sc.id} · {sc.title}</span>
                <Badge tone={sc.level.toLowerCase()}>{sc.level}</Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="card section-gap" style={{ borderLeft: "3px solid var(--brass)" }}>
          <div className="txt-xs">Tapping a scenario jumps the prototype to that point in the PLAN → MONITOR → EMERGENCY → RESCUE → RECOVER storyline for a live judge walkthrough.</div>
        </div>
      </div>
    </Screen>
  );
}
