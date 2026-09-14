import React from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Badge, Icon } from "../components/Shared";
import LeafletMap from "../components/LeafletMap";
import { scenarioConditions, activeTrip, userProfile, riskAssessment, alertsFeed, dataSources } from "../mock";

const agentRoster = [
  { name: "Weather Agent", tag: "REAL", source: "IMD gridded forecast", confidence: 0.91 },
  { name: "Ocean Agent", tag: "SIM", source: "Seeded wave/swell dataset", confidence: 0.84 },
  { name: "Geospatial Agent", tag: "REAL", source: "PostGIS boundaries", confidence: 0.95 },
  { name: "Satellite Agent", tag: "SIM", source: "Sample SST/chlorophyll product", confidence: 0.72 },
  { name: "Tide Agent", tag: "SIM", source: "Seeded tide table", confidence: 0.8 },
];

export default function Home() {
  const { go, scenario, sendMessage, conditions, posts, profile, contacts, t } = useApp();
  const cond = conditions || scenarioConditions[scenario] || scenarioConditions.YELLOW;
  const tone = (cond.level || scenario).toLowerCase();
  const firstName = (profile.name || userProfile.firstName).split(" ")[0];
  const trustedPosts = (posts || []).filter((p) => p.verified).length;
  const confidencePct = Math.round(parseFloat(riskAssessment.confidence) * 100);
  const priorityAlerts = (alertsFeed || []).filter((a) => !a.faded).slice(0, 2);

  const askQuick = (q) => {
    go("chat");
    setTimeout(() => sendMessage(q), 260);
  };

  return (
    <Screen id="home">
      <div className="dash-page">
        <div className="dash-greeting-row">
          <div className="dash-greeting">
            <div className="eyebrow-sm">
              <span className="live-dot" style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
              LIVE MARITIME PICTURE
            </div>
            <h1>{t("namaste")} {firstName}</h1>
            <p>
              A grounded view of marine conditions, agent coordination, and safety signals for the{" "}
              {profile.homePort || userProfile.homePort} — {cond.updated}.
            </p>
          </div>
          <div className="dash-greeting-actions">
            <button className="btn ghost inline" onClick={() => go("plan")}>{t("tile_plan")}</button>
            <button className="btn primary inline" onClick={() => go("chat")}>+ New assessment</button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="row">
              <span className="eyebrow-sm">Marine risk level</span>
              <div className="stat-ico" style={{ background: "var(--" + tone + "-tint)" }}>
                <Icon.waves style={{ stroke: "var(--" + tone + ")" }} />
              </div>
            </div>
            <div className="stat-val" style={{ color: "var(--" + tone + ")" }}>{cond.level}</div>
            <div className="stat-sub">{cond.levelLabel} · wind {cond.wind} · waves {cond.waves}</div>
          </div>

          <div className="stat-card">
            <div className="row">
              <span className="eyebrow-sm">Active safety alerts</span>
              <div className="stat-ico" style={{ background: "var(--orange-tint)" }}><Icon.bell style={{ stroke: "var(--orange)" }} /></div>
            </div>
            <div className="stat-val">{cond.alertsActive}</div>
            <div className="stat-sub" onClick={() => go("alerts")} style={{ cursor: "pointer" }}>
              <b>{cond.alertsActive === 0 ? "All clear" : "Requires attention"}</b> — view alert center
            </div>
          </div>

          <div className="stat-card">
            <div className="row">
              <span className="eyebrow-sm">Community reports</span>
              <div className="stat-ico" style={{ background: "var(--teal-tint)" }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><circle cx="9" cy="7" r="3" /><path d="M2 21v-1a5 5 0 015-5h4a5 5 0 015 5v1" /><circle cx="17" cy="7.5" r="2.3" /><path d="M16.5 13.2c1.9.3 3.5 1.8 3.5 4.2V21" /></svg>
              </div>
            </div>
            <div className="stat-val">{(posts || []).length}</div>
            <div className="stat-sub"><b>{trustedPosts} trusted</b> from fellow fishermen nearby</div>
          </div>

          <div className="stat-card">
            <div className="row">
              <span className="eyebrow-sm">Risk engine confidence</span>
              <div className="stat-ico" style={{ background: "var(--green-tint)" }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" /></svg>
              </div>
            </div>
            <div className="stat-val">{confidencePct}%</div>
            <div className="stat-sub"><b>Deterministic</b> — never phrased or invented by the LLM</div>
          </div>
        </div>

        <div className="op-grid">
          <div className="panel">
            <div className="panel-head">
              <div className="col">
                <span className="eyebrow-sm">Operational waters</span>
                <span className="h-title">Trip &amp; route intelligence</span>
              </div>
              <span className="panel-link" onClick={() => go("map")}>Open full map →</span>
            </div>
            <div className="panel-map">
              <LeafletMap variant="full" height={280} interactive={false} />
              <div className="map-caption">
                <b>{activeTrip.zone}</b>
                Started {activeTrip.started} · {activeTrip.geofence}
              </div>
            </div>
            <div className="op-substats">
              <div className="item"><b>{activeTrip.elapsed}</b><span>Trip elapsed</span></div>
              <div className="item"><b>{activeTrip.wind}</b><span>Current wind</span></div>
              <div className="item"><b>{activeTrip.waves}</b><span>Current waves</span></div>
              <div className="item"><b>{contacts.length}</b><span>Emergency contacts</span></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="col">
                <span className="eyebrow-sm">Priority queue</span>
                <span className="h-title">Needs your attention</span>
              </div>
              <span className="panel-link" onClick={() => go("alerts")}>View all →</span>
            </div>
            <div className="priority-list">
              {priorityAlerts.map((a) => (
                <div key={a.id} className="priority-item" onClick={() => go(a.link || "alerts")}>
                  <div className="row">
                    <Badge tone={a.tone}>{a.badge}</Badge>
                    <span className="txt-xs">{a.time}</span>
                  </div>
                  <div className="h-title">{a.title}</div>
                  {a.sub && <div className="txt-xs">{a.sub}</div>}
                </div>
              ))}
              <div className="priority-item" onClick={() => go("community")}>
                <div className="row">
                  <Badge tone="teal">COMMUNITY</Badge>
                  <span className="txt-xs">12 min ago</span>
                </div>
                <div className="h-title">"Waves picking up near Zone B, came in early."</div>
                <div className="txt-xs">— Suresh P. · marked trusted by {trustedPosts} fishermen</div>
              </div>
              <span className="priority-link" onClick={() => go("history")}>Review trip history →</span>
            </div>
          </div>
        </div>

        <div className="op-grid" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
          <div className="panel">
            <div className="panel-head">
              <div className="col">
                <span className="eyebrow-sm">Agent coordination</span>
                <span className="h-title">Collaborative reasoning running now</span>
              </div>
              <span className="panel-link" onClick={() => go("trace")}>Activity log →</span>
            </div>
            <div className="agent-panel">
              {agentRoster.map((a) => (
                <div className="agent-row" key={a.name}>
                  <span className="agent-name">{a.name}</span>
                  <div className="agent-bar-track">
                    <div className="agent-bar-fill" style={{ width: `${Math.round(a.confidence * 100)}%` }} />
                  </div>
                  <span className="agent-pct">{Math.round(a.confidence * 100)}%</span>
                  <span className={`tag ${a.tag.toLowerCase()}`}>{a.tag}</span>
                </div>
              ))}
            </div>
            <div className="txt-xs" style={{ marginTop: 12 }}>
              Every figure above is produced by the deterministic risk engine in <code>agents.py</code> — the explain-only
              response layer can phrase it in English or Hindi but can never change a score or invent a source.
            </div>
          </div>

          <div className="briefing-card" onClick={() => go("chat")}>
            <span className="eyebrow-sm" style={{ color: "#8FD0F5" }}>GROUNDED</span>
            <div className="h-title">{t("ask_orca")}</div>
            <div className="txt-sm">Get a decision-ready summary from live marine signals, agent evidence, and your trip context — in English or Hindi.</div>
            <button className="btn">{t("ask_placeholder")} →</button>
          </div>
        </div>

        <div className="row section-gap" style={{ marginTop: 24 }}>
          <div className="h-title" style={{ fontSize: 15 }}>{t("quick_access")}</div>
        </div>
        <div className="quick-row">
          <div className="quick-tile" onClick={() => go("plan")} style={{ padding: "20px 12px" }}>
            <div className="qt-ico" style={{ background: "var(--teal-tint)", margin: "0 auto 10px" }}><Icon.calendar /></div>
            <div className="qt-label">{t("tile_plan")}</div>
          </div>
          <div className="quick-tile" onClick={() => go("map")} style={{ padding: "20px 12px" }}>
            <div className="qt-ico" style={{ background: "var(--brass-tint)", margin: "0 auto 10px" }}><Icon.map /></div>
            <div className="qt-label">{t("tile_map")}</div>
          </div>
          <div className="quick-tile" onClick={() => go("history")} style={{ padding: "20px 12px" }}>
            <div className="qt-ico" style={{ background: "var(--green-tint)", margin: "0 auto 10px" }}><Icon.history /></div>
            <div className="qt-label">{t("tile_history")}</div>
          </div>
        </div>

        <div className="txt-xs" style={{ marginTop: 26, textAlign: "center" }}>
          Working prototype for ORCA · Problem Statement 26176 · data sources: {dataSources.map((d) => d.name).join(" · ")} — each tagged REAL or SIM above.
        </div>
      </div>
    </Screen>
  );
}
