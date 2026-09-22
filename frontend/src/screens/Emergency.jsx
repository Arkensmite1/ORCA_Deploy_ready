import React, { useCallback, useRef } from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Badge, Icon, Tag, TopBar } from "../components/Shared";
import LeafletMap from "../components/LeafletMap";
import { emergencyTypes } from "../mock";

const HOLD_MS = 3000;
const CIRC = 427;

export function SosConfirm() {
  const { go, sosType, setSosType, triggerSos } = useApp();
  const circleRef = useRef(null);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  const resetHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const c = circleRef.current;
    if (c) {
      c.style.transition = "stroke-dashoffset .25s ease";
      c.setAttribute("stroke-dashoffset", String(CIRC));
    }
  }, []);

  const startHold = useCallback(() => {
    const c = circleRef.current;
    if (!c) return;
    c.style.transition = "none";
    startRef.current = Date.now();
    const step = () => {
      const pct = Math.min((Date.now() - startRef.current) / HOLD_MS, 1);
      c.setAttribute("stroke-dashoffset", String(CIRC - CIRC * pct));
      if (pct >= 1) {
        resetHold();
        triggerSos();
        go("emergency");
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [go, resetHold, triggerSos]);

  return (
    <Screen id="sosconfirm">
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "radial-gradient(circle at 50% 12%, #FDECEB 0%, #FFFDFB 55%)", color: "var(--ink)" }}>
        <div className="pad" style={{ textAlign: "center", paddingTop: 26 }}>
          <div className="eyebrow-sm" style={{ color: "var(--red)" }}>EMERGENCY ACTIVATION</div>
          <div className="h-title" style={{ color: "var(--ink)", fontSize: 20, marginTop: 6 }}>What's happening?</div>
          <div className="txt-sm" style={{ marginTop: 4 }}>Pick the closest match — you can add detail after help is on the way.</div>
        </div>
        <div className="pad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, paddingTop: 0 }}>
          {emergencyTypes.map((t) => (
            <div key={t} className={`chip ${sosType === t ? "on" : ""}`} style={{ textAlign: "center" }} onClick={() => setSosType(t)}>{t}</div>
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 30px" }}>
          <div
            className="hold-btn"
            onMouseDown={startHold}
            onTouchStart={startHold}
            onMouseUp={resetHold}
            onTouchEnd={resetHold}
            onMouseLeave={resetHold}
          >
            <svg className="hold-ring" width="150" height="150">
              <circle ref={circleRef} cx="75" cy="75" r="68" fill="none" stroke="var(--red)" strokeWidth="6" strokeDasharray={CIRC} strokeDashoffset={CIRC} strokeLinecap="round" />
            </svg>
            <span>HOLD 3s<br />TO SEND SOS</span>
          </div>
          <div className="txt-xs" style={{ marginTop: 18, textAlign: "center" }}>
            Holding, not tapping, prevents an SOS from a pocket-press. Your location is captured the instant this completes.
          </div>
        </div>
        <div className="pad"><button className="btn ghost" onClick={() => go("trip")}>Cancel</button></div>
      </div>
    </Screen>
  );
}

export function Emergency() {
  const { go, toggleSheet, sosType, t, emergency, contactEmergencyService, shareLocation } = useApp();
  const e = emergency;
  return (
    <Screen id="emergency">
      <TopBar
        title={t("title_emergency")}
        danger
        right={<div className="iconbtn" style={{ background: "var(--surface-2)" }} onClick={() => toggleSheet("cancelsos", true)}><Icon.close style={{ stroke: "var(--red)" }} /></div>}
      />
      <div className="pad">
        <LeafletMap variant="emergency" height={140} />
        <div className="card section-gap">
          <div className="txt-xs">Latest known position</div>
          <div className="txt-sm coord" style={{ fontWeight: 700, color: "var(--ink)", marginTop: 2 }}>{e.position}</div>
        </div>
        <div className="row" style={{ gap: 9, marginTop: 10 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="txt-xs">People onboard</div>
            <div className="txt-sm" style={{ fontWeight: 700, marginTop: 2 }}>{e.people}</div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="txt-xs">Emergency type</div>
            <div className="txt-sm" style={{ fontWeight: 700, marginTop: 2 }}>{sosType}</div>
          </div>
        </div>
        <div className="card">
          <div className="row"><span className="eyebrow-sm">Status</span><Badge tone="orange">HELP REQUESTED</Badge></div>
          <div className="col" style={{ marginTop: 11, gap: 9 }}>
            {e.timeline.map((t) => (
              <div className="row" key={t.label}><span className="txt-xs">{t.label}</span><span className="txt-xs" style={{ fontWeight: 700 }}>{t.value}</span></div>
            ))}
            <div className="row">
              <span className="txt-xs">Rescue assigned</span>
              <span className="txt-xs" style={{ fontWeight: 700, color: "var(--teal)", cursor: "pointer" }} onClick={() => go("rescue")}>View →</span>
            </div>
          </div>
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 0, display: "flex", flexDirection: "column", gap: 9 }}>
        <button className="btn sos" onClick={contactEmergencyService}>Contact emergency service</button>
        <button className="btn ghost-red" onClick={shareLocation}>Share location</button>
        <button className="btn ghost-red" onClick={() => toggleSheet("contacts", true)}>Call emergency contact</button>
        <button className="btn ghost" onClick={() => toggleSheet("safeloc", true)}>View safe location</button>
      </div>
    </Screen>
  );
}

export function Rescue() {
  const { go, t, emergency } = useApp();
  const r = emergency.rescue;
  return (
    <Screen id="rescue">
      <TopBar title={t("title_rescue")} onBack={() => go("emergency")} />
      <div style={{ position: "relative" }}>
        <div className="pad" style={{ paddingBottom: 0 }}>
          <LeafletMap variant="rescue" height={240} />
        </div>
        <div className="map-float" style={{ top: 26, left: 30 }}><Tag kind="sim">SIM — DEMO RESCUE DATA</Tag></div>
      </div>
      <div className="pad">
        <div className="card">
          <div className="row"><span className="eyebrow-sm">Rescue status</span><Badge tone="orange">{r.status}</Badge></div>
          <div className="txt-sm" style={{ marginTop: 9 }}>
            <b style={{ color: "var(--ink)" }}>{r.unit}</b> · {r.eta}<br />{r.note}
          </div>
        </div>
        <div className="txt-xs" style={{ marginTop: 12, textAlign: "center" }}>
          Live rescue-unit location requires authorized agency integration. This screen shows a labelled simulation for demonstration.
        </div>
      </div>
    </Screen>
  );
}
