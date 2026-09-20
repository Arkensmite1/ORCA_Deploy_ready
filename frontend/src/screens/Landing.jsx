import React from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { OrcaMark } from "../components/AppShell";
import { scenarioConditions, userProfile } from "../mock";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function Landing() {
  const { go, scenario, conditions } = useApp();
  const cond = conditions || scenarioConditions[scenario] || scenarioConditions.YELLOW;

  return (
    <Screen id="landing">
      <div className="land">
        <div className="land-nav">
          <div className="land-nav-top">
            <span>ORCA Maritime Safety Network · Ratnagiri Coast Pilot</span>
            <span>
              <a onClick={() => window.location.href = "tel:+91-1554-222080"}>Coast Guard Helpline</a>
              <a onClick={() => scrollToId("land-footer")}>Contact</a>
              <a>EN</a>
            </span>
          </div>
          <div className="land-nav-main">
            <div className="brand-block" onClick={() => scrollToId("land-top")} role="button" tabIndex={0}>
              <OrcaMark />
              <div className="wordmark">ORCA<small>Marine Intelligence &amp; Safety</small></div>
            </div>
            <div className="land-links">
              <a onClick={() => scrollToId("land-top")}>Home</a>
              <a onClick={() => scrollToId("land-platform")}>Platform</a>
              <a onClick={() => scrollToId("land-capabilities")}>Capabilities</a>
              <a onClick={() => scrollToId("land-standard")}>Intelligence</a>
            </div>
            <button className="land-btn primary" onClick={() => go("login")}>Sign in</button>
          </div>
          <div className="land-advisory">
            <span>⚠ WEATHER: {cond.levelLabel} forecast for the Ratnagiri coast.</span>
            <span>⚠ GEOFENCE: vessels tracked within 2.1 km of the restricted boundary.</span>
          </div>
        </div>

        <div id="land-top" className="land-hero">
          <div>
            <span className="land-eyebrow"><span className="live-dot" />LIVE MARINE INTELLIGENCE</span>
            <h1>See risk clearly.<br /><span className="accent">Fish with confidence.</span></h1>
            <p className="lead">
              ORCA gives small-boat fishermen a shared, grounded picture of wind, waves, and marine
              warnings — reasoned by five specialist agents and explained in plain English or Hindi,
              so every decision to go or stay is backed by evidence, not a guess.
            </p>
            <div className="land-cta-row">
              <button className="land-btn primary" onClick={() => go("login")}>Open command center →</button>
              <button className="land-btn ghost" onClick={() => scrollToId("land-capabilities")}>See how ORCA reasons</button>
            </div>
            <div className="land-stats">
              <div className="item"><b>5</b><span>Specialist agents</span></div>
              <div className="item"><b>4</b><span>Risk levels tracked</span></div>
              <div className="item"><b>5</b><span>Languages supported</span></div>
              <div className="item"><b>0</b><span>Invented figures — ever</span></div>
            </div>
          </div>

          <div className="land-hero-card" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1541828985935-1fe979f9fc0b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200)" }}>
            <span className="eyebrow-sm">LIVE MARINE INTELLIGENCE</span>
            <div className="h-title">{cond.levelLabel} — {userProfile.coast}</div>
            <div className="txt-xs" style={{ color: "#CBD9F2", marginTop: 6 }}>{cond.updated} <span className="tag sim" style={{ marginLeft: 6 }}>SIM</span></div>
            <div className="land-hero-metrics">
              <div className="m"><span>Wind</span><b>{cond.wind}</b></div>
              <div className="m"><span>Waves</span><b>{cond.waves}</b></div>
              <div className="m"><span>Alerts</span><b>{cond.alertsActive === 0 ? "None" : cond.alertsActive}</b></div>
            </div>
            <div className="land-hero-note">
              Every reading above is tagged REAL or SIM and traceable to a named agent.{" "}
              <a onClick={() => go("login")}>View the full briefing →</a>
            </div>
          </div>
        </div>

        <div id="land-platform" className="land-section">
          <div className="land-eyebrow">ONE OPERATIONAL PICTURE</div>
          <h2>From signal to safe passage</h2>
          <p className="sub">
            ORCA connects live weather, wave, geospatial, satellite and tide signals into one grounded
            answer — then keeps watching your trip until you're back at the harbour.
          </p>
          <div className="land-split">
            <div className="land-tile">
              <div className="land-tile-art" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1585713181935-d5f622cc2415?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000)" }}></div>
              <h3>Live maritime picture</h3>
              <p>Wind, wave and geofence conditions from the Weather, Ocean and Geospatial agents — understood before risk reaches the boat.</p>
              <span className="land-link" onClick={() => go("login")}>Explore the map →</span>
            </div>
            <div className="land-tile">
              <div className="land-agent-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" /></svg>
              </div>
              <h3>Decision-ready intelligence</h3>
              <p>Ask in plain English or Hindi and get a grounded Go / Watch / Reconsider verdict — built from five agents, never invented by the model.</p>
              <span className="land-link" onClick={() => go("login")}>See the agent trace →</span>
            </div>
          </div>
        </div>

        <div id="land-capabilities" className="land-section" style={{ paddingTop: 0 }}>
          <div className="land-section-head">
            <div className="land-eyebrow">DESIGNED FOR OPERATIONS</div>
            <h2>Confidence at every watch change</h2>
            <p className="sub">Built around the decisions that keep a small crew, their boat, and their catch safe.</p>
          </div>
          <div className="land-feature-grid">
            <div className="land-feature">
              <div className="fi" style={{ background: "var(--teal-tint)" }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--teal-bright)" strokeWidth="2"><path d="M3 8h11a3 3 0 100-6" /><path d="M3 16h15a3 3 0 110 6" /></svg>
              </div>
              <h4>Trip monitoring</h4>
              <p>Continuous wind, wave and geofence tracking once you're at sea, with alerts the moment conditions change.</p>
            </div>
            <div className="land-feature">
              <div className="fi" style={{ background: "rgba(240,128,63,.16)" }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" /></svg>
              </div>
              <h4>Deterministic risk engine</h4>
              <p>Go / Watch / Reconsider verdicts from wind, wave and warning thresholds — GREEN, YELLOW, ORANGE, RED — never phrased by the LLM.</p>
            </div>
            <div className="land-feature">
              <div className="fi" style={{ background: "rgba(234,76,70,.16)" }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4M12 17v.5" /></svg>
              </div>
              <h4>One-tap SOS</h4>
              <p>Location, vessel and situation shared instantly with your emergency contacts and the coast guard — no repeating yourself under stress.</p>
            </div>
            <div className="land-feature">
              <div className="fi" style={{ background: "rgba(46,155,214,.16)" }}>
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#2E9BD6" strokeWidth="2"><path d="M4 5h16v11H8l-4 4V5z" /></svg>
              </div>
              <h4>Agent-grounded answers</h4>
              <p>Ask in English, Hindi or mixed regional speech; five agents answer in parallel and an explain-only layer phrases the result.</p>
            </div>
          </div>
        </div>

        <div id="land-standard" className="land-section" style={{ paddingTop: 0 }}>
          <div className="land-standard">
            <div className="land-standard-copy">
              <div className="land-eyebrow">THE ORCA STANDARD</div>
              <h3>Built for the moments when certainty matters.</h3>
              <p>Every ORCA workspace brings together live conditions, agent evidence, and community reports — with REAL/SIM tagging that keeps every figure honest and traceable.</p>
            </div>
            <div className="land-standard-stats">
              <div className="box"><b>24/7</b><span>Continuous trip monitoring</span></div>
              <div className="box"><b>REAL+SIM</b><span>Transparent data tagging</span></div>
            </div>
          </div>
        </div>

        <div className="land-cta-banner">
          <div className="land-cta-inner">
            <div>
              <span className="land-eyebrow">YOUR NEXT TRIP</span>
              <h2>Ready to make your next trip safer?</h2>
              <p>Start with ORCA's live command center and get a grounded verdict before you leave the harbour.</p>
            </div>
            <button className="land-btn dark" onClick={() => go("login")}>Enter ORCA command center →</button>
          </div>
        </div>

        <div id="land-footer" className="land-footer">
          <div className="land-footer-inner">
            <span><b style={{ color: "var(--ink)" }}>ORCA</b> · Marine Intelligence &amp; Safety</span>
            <span>
              <a onClick={() => scrollToId("land-platform")}>Platform</a>
              <a onClick={() => scrollToId("land-capabilities")}>Capabilities</a>
              <a onClick={() => go("login")}>Sign in</a>
              <a>ORCA Marine Intelligence</a>
            </span>
          </div>
        </div>
      </div>
    </Screen>
  );
}
