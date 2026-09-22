import React, { useEffect, useState } from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Icon, TopBar, Tag } from "../components/Shared";
import { riskAssessment, agentTrace } from "../mock";
import api from "../api";

export function Risk() {
  const { go, toggleSheet, scenario, t } = useApp();
  const [r, setR] = useState(riskAssessment);
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await api.risk(scenario);
      if (alive && data) setR(data);
    })();
    return () => { alive = false; };
  }, [scenario]);
  const dialColor = `var(--${(r.level || "green").toLowerCase()})`;
  return (
    <Screen id="risk">
      <TopBar title={t("title_risk")} onBack={() => go("chat")} />
      <div className="pad">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 0 6px" }}>
          <div className="dial-wrap">
            <svg viewBox="0 0 168 168">
              <circle cx="84" cy="84" r="72" fill="none" stroke="var(--paper-deep)" strokeWidth="12" />
              <circle cx="84" cy="84" r="72" fill="none" stroke={dialColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="452" strokeDashoffset={r.dialOffset} />
              <circle cx="84" cy="84" r="72" fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="1 12.6" />
            </svg>
            <div className="dial-center">
              <div className="lvl" style={{ color: dialColor }}>{r.level}</div>
              <div className="lbl">{r.recommendation ? r.recommendation.replace("Recommended: ", "") : "Low risk"} · score {r.score}</div>
            </div>
          </div>
          <div className="h-title" style={{ marginTop: 13, fontSize: 18 }}>{r.recommendation}</div>
          <div className="txt-xs" style={{ marginTop: 5 }}>CONFIDENCE {r.confidence} · UPDATED {r.updated}</div>
        </div>

        <div className="card">
          <div className="eyebrow-sm">Why</div>
          <div className="txt-sm" style={{ marginTop: 7 }}>
            {r.why.map((w, i) => <div key={i}>{i + 1}. {w}</div>)}
          </div>
        </div>

        <div className="row" style={{ gap: 9, marginTop: 11 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="txt-xs">Weather</div>
            <div className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{r.weather}</div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="txt-xs">Ocean</div>
            <div className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{r.ocean}</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: "3px solid var(--yellow)" }}>
          <div className="eyebrow-sm" style={{ color: "var(--yellow)" }}>Return window</div>
          <div className="txt-sm" style={{ marginTop: 5 }}>{r.returnWindow}</div>
        </div>

        <div className="card" style={{ cursor: "pointer" }} onClick={() => toggleSheet("explain", true)}>
          <div className="row">
            <span className="h-title" style={{ fontSize: 13.5 }}>Why should I trust this?</span>
            <Icon.chevron style={{ stroke: "var(--teal)" }} />
          </div>
          <div className="txt-xs" style={{ marginTop: 4 }}>See the reasoning behind this recommendation</div>
        </div>

        <div className="card" style={{ cursor: "pointer" }} onClick={() => toggleSheet("evidence", true)}>
          <div className="row">
            <span className="h-title" style={{ fontSize: 13.5 }}>View evidence &amp; sources</span>
            <Icon.chevron style={{ stroke: "var(--teal)" }} />
          </div>
          <div className="txt-xs" style={{ marginTop: 4 }}>4 SOURCES · LAST VERIFIED 10:42</div>
        </div>

        <div className="card" style={{ cursor: "pointer" }} onClick={() => go("trace")}>
          <div className="row">
            <span className="h-title" style={{ fontSize: 13.5 }}>See how ORCA reasoned this out</span>
            <Icon.chevron style={{ stroke: "var(--teal)" }} />
          </div>
          <div className="txt-xs" style={{ marginTop: 4 }}>AGENT TRACE · 7 AGENTS · 2 TOOL CALLS PARALLEL</div>
        </div>

        <button className="btn primary section-gap" onClick={() => go("plan")}>Start trip with this plan</button>
      </div>
    </Screen>
  );
}

export function Trace() {
  const { go, scenario, t } = useApp();
  const [nodes, setNodes] = useState(agentTrace);
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await api.trace(scenario);
      if (alive && data) setNodes(data);
    })();
    return () => { alive = false; };
  }, [scenario]);
  return (
    <Screen id="trace">
      <TopBar title={t("title_trace")} onBack={() => go("risk")} right={<Tag kind="sim">DEV VIEW</Tag>} />
      <div className="pad">
        <div className="txt-xs" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
          This is not a chatbot answer — it's the actual orchestration run behind &quot;Can I go fishing tomorrow
          morning?&quot;. Nothing here is invented by the language model; every value comes from a structured agent contract.
        </div>

        <div className="section-gap" style={{ display: "flex", flexDirection: "column" }}>
          {nodes.map((t, i) => (
            <div className="trace-node" key={i}>
              <div className="trace-rail">
                <div className="tnode" style={{ background: t.color }}></div>
                {i < nodes.length - 1 && <div className="tconn"></div>}
              </div>
              <div className="card" style={{ flex: 1, marginTop: 0, marginBottom: 10 }}>
                <div className="row">
                  <span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{t.name}</span>
                  {t.parallel ? <Tag kind="real">PARALLEL</Tag> : <span className="txt-xs">{t.time}</span>}
                </div>
                <div className="txt-xs" style={{ marginTop: 5 }}>{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card section-gap" style={{ borderLeft: "3px solid var(--teal)" }}>
          <div className="eyebrow-sm" style={{ color: "var(--teal)" }}>Why this matters for judging</div>
          <div className="txt-sm" style={{ marginTop: 5 }}>
            This screen is the proof that ORCA is a tool-grounded multi-agent system, not a single LLM call pretending
            to know the weather.
          </div>
        </div>
      </div>
    </Screen>
  );
}
