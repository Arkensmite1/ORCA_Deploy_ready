import React, { useEffect, useState } from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Badge, Icon, TopBar } from "../components/Shared";
import { planDays, alertsFeed, quickChipsPlan } from "../mock";
import api from "../api";

export function Plan() {
  const { go, sendMessage, t } = useApp();
  const [day, setDay] = useState(1);
  const detail = planDays.find((d) => d.day === day);

  return (
    <Screen id="plan">
      <TopBar title={t("title_plan")} onBack={() => go("home")} />
      <div className="pad">
        <div className="card" style={{ background: "var(--teal-tint)", borderColor: "transparent" }}>
          <div className="txt-sm" style={{ color: "var(--teal-deep)" }}>
            This plan updates automatically as conditions change — you won't need to ask again each day.
          </div>
        </div>

        <div className="ask-card section-gap" onClick={() => go("chat")}>
          <div className="row">
            <span className="h-title" style={{ fontSize: 14.5 }}>Ask ORCA about this plan</span>
            <span className="tag real">GROUNDED</span>
          </div>
          <div className="ask-input">
            <span className="txt-sm" style={{ color: "var(--ink-faint)", flex: 1 }}>What about Day 3 conditions?</span>
            <div className="ask-send"><Icon.arrow /></div>
          </div>
          <div className="scrollx" style={{ marginTop: 10 }}>
            {quickChipsPlan.map((c) => (
              <span key={c} className="chip" onClick={(e) => { e.stopPropagation(); go("chat"); setTimeout(() => sendMessage(c), 260); }}>{c}</span>
            ))}
          </div>
        </div>

        <div className="row section-gap">
          <div className="h-title" style={{ fontSize: 14.5 }}>Day-by-day</div>
        </div>
        <div className="scrollx" style={{ marginTop: 9 }}>
          {planDays.map((d) => (
            <span key={d.day} className={`chip ${day === d.day ? "on" : ""}`} onClick={() => setDay(d.day)}>Day {d.day}</span>
          ))}
        </div>

        <div className="card section-gap" style={detail.changed ? { borderLeft: "3px solid var(--orange)" } : undefined}>
          <div className="row">
            <span className="eyebrow-sm">{detail.label}</span>
            <Badge tone={detail.tone}>{detail.badge}</Badge>
          </div>
          <div className="txt-sm" style={{ marginTop: 7 }}>
            {detail.text}
            {detail.sub && <><br />{detail.sub}</>}
          </div>
          {detail.changed && <button className="btn ghost sm section-gap" onClick={() => go("map")}>View alternative area</button>}
        </div>
      </div>
    </Screen>
  );
}

export function Alerts() {
  const { go, toggleSheet, scenario, t } = useApp();
  const [feed, setFeed] = useState(alertsFeed);
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await api.alerts(scenario);
      if (alive && data) setFeed(data);
    })();
    return () => { alive = false; };
  }, [scenario]);
  return (
    <Screen id="alerts">
      <TopBar
        title={t("title_alerts")}
        right={<span className="txt-xs" style={{ color: "var(--teal)", fontWeight: 700, cursor: "pointer" }} onClick={() => toggleSheet("alertsettings", true)}>Manage</span>}
      />
      <div className="pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {feed.map((a, i) => (
          <div className="timeline-item" key={a.id}>
            <div className="timeline-rail">
              <div className="tdot" style={{ background: `var(--${a.tone})` }}></div>
              {i < feed.length - 1 && <div className="tline"></div>}
            </div>
            <div
              className="card"
              style={{ flex: 1, cursor: a.link ? "pointer" : "default", opacity: a.faded ? 0.6 : 1 }}
              onClick={() => a.link && go(a.link)}
            >
              <div className="row">
                <Badge tone={a.tone}>{a.badge}</Badge>
                <span className="txt-xs">{a.time}</span>
              </div>
              <div className="txt-sm" style={{ marginTop: 7, fontWeight: 600, color: "var(--ink)" }}>{a.title}</div>
              {a.sub && <div className="txt-xs" style={{ marginTop: 5 }}>{a.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}
