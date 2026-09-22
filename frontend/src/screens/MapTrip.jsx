import React, { useState } from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Badge, Icon, TopBar } from "../components/Shared";
import LeafletMap from "../components/LeafletMap";
import { activeTrip, mapLayers, scenarioConditions } from "../mock";

export function MapScreen() {
  const { go, toggleSheet, t } = useApp();
  const [layer, setLayer] = useState("Route");
  const [base, setBase] = useState("satellite");
  return (
    <Screen id="map">
      <TopBar
        title={t("title_map")}
        right={<div className="iconbtn" onClick={() => toggleSheet("layers", true)}><Icon.layers /></div>}
      />
      <div style={{ position: "relative", height: "calc(100% - 62px)" }}>
        <LeafletMap variant="full" activeLayer={layer} base={base} height="100%" interactive radius />
        <div className="map-float" style={{ top: 12, left: 12, right: 12 }}>
          <div className="scrollx">
            {mapLayers.map((l) => (
              <span key={l} className={`chip ${layer === l ? "on" : ""}`} onClick={() => setLayer(l)}>{l}</span>
            ))}
          </div>
        </div>
        <div className="map-float" style={{ top: 56, right: 12 }}>
          <div style={{ display: "flex", background: "#fff", border: "1px solid var(--line)", borderRadius: 11, padding: 3, boxShadow: "var(--shadow-card)" }}>
            {["satellite", "nautical"].map((b) => (
              <span
                key={b}
                onClick={() => setBase(b)}
                style={{ fontSize: 10, fontWeight: 700, padding: "6px 10px", borderRadius: 8, cursor: "pointer", textTransform: "capitalize",
                  background: base === b ? "var(--teal)" : "transparent", color: base === b ? "#fff" : "var(--ink-soft)" }}
              >{b}</span>
            ))}
          </div>
        </div>
        <div className="map-float card" style={{ bottom: 84, left: 12, right: 12 }}>
          <div className="row">
            <div className="col">
              <span className="eyebrow-sm">Nearest safe location</span>
              <span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>Ratnagiri Harbour</span>
            </div>
            <span className="txt-xs" style={{ textAlign: "right" }}>4.2 km<br />~22 min</span>
          </div>
          <div className="txt-xs" style={{ marginTop: 6 }}>Active layer: <b style={{ color: "var(--teal-deep)" }}>{layer}</b> · SIM layers are always tagged, never mixed with REAL data</div>
        </div>
        <div className="map-float" style={{ bottom: 14, left: 12, right: 12, display: "flex", gap: 8, paddingRight: 56 }}>
          <button className="btn ghost sm" onClick={() => go("trip")}>{t("btn_active_trip")}</button>
          <button className="btn primary sm" onClick={() => toggleSheet("safeloc", true)}>{t("btn_find_shelter")}</button>
        </div>
      </div>
    </Screen>
  );
}

export function Trip() {
  const { go, toggleSheet, scenario, conditions, t } = useApp();
  const cond = conditions || scenarioConditions[scenario] || scenarioConditions.YELLOW;
  const tone = (cond.level || scenario).toLowerCase();
  return (
    <Screen id="trip">
      <TopBar title={t("title_trip")} right={<Badge tone={tone}>{cond.level}</Badge>} />
      <div className="pad">
        <LeafletMap variant="trip" height={190} />
        <div className="row" style={{ marginTop: 11, gap: 9 }}>
          <div className="card" style={{ flex: 1, textAlign: "center", padding: 10 }}>
            <div className="txt-xs">Wind</div>
            <div className="h-title" style={{ fontSize: 14 }}>{activeTrip.wind}</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center", padding: 10 }}>
            <div className="txt-xs">Waves</div>
            <div className="h-title" style={{ fontSize: 14 }}>{activeTrip.waves}</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center", padding: 10 }}>
            <div className="txt-xs">Elapsed</div>
            <div className="h-title" style={{ fontSize: 14 }}>{activeTrip.elapsed}</div>
          </div>
        </div>
        <div className="card section-gap" style={{ borderLeft: "3px solid var(--yellow)" }}>
          <div className="eyebrow-sm" style={{ color: "var(--yellow)" }}>Geofence</div>
          <div className="txt-sm" style={{ marginTop: 4 }}>{activeTrip.geofence}</div>
        </div>
        <div className="card">
          <div className="row"><span className="eyebrow-sm">Return window</span><span className="txt-xs">{activeTrip.returnUpdated}</span></div>
          <div className="txt-sm" style={{ marginTop: 5 }}>{activeTrip.returnWindow}</div>
        </div>
        <div className="card" style={{ cursor: "pointer" }} onClick={() => go("alerts")}>
          <div className="row">
            <span className="h-title" style={{ fontSize: 13.5 }}>Trip alerts ({activeTrip.alertCount})</span>
            <Icon.chevron style={{ stroke: "var(--teal)" }} />
          </div>
        </div>
        <div className="row" style={{ gap: 9, marginTop: 12 }}>
          <button className="btn ghost" onClick={() => toggleSheet("safeloc", true)}>{t("btn_find_shelter")}</button>
          <button className="btn ghost" onClick={() => go("map")}>{t("btn_safe_route")}</button>
        </div>
        <button className="btn sos section-gap" onClick={() => go("sosconfirm")}>
          <Icon.warnWhite /> {t("btn_sos_emergency")}
        </button>
        <button className="btn ghost-red" style={{ marginTop: 9 }} onClick={() => toggleSheet("endtrip", true)}>{t("btn_end_trip")}</button>
      </div>
    </Screen>
  );
}

export function Geofence() {
  const { go, t } = useApp();
  return (
    <Screen id="geofence">
      <TopBar
        title={t("title_geofence")}
        warn
        right={<div className="iconbtn" onClick={() => go("trip")}><Icon.close /></div>}
      />
      <div style={{ position: "relative" }}>
        <LeafletMap variant="geofence" height={200} />
      </div>
      <div className="pad">
        <div className="card" style={{ borderLeft: "3px solid var(--orange)" }}>
          <Badge tone="orange">GEOFENCE_PROXIMITY</Badge>
          <div className="txt-sm" style={{ marginTop: 9 }}>
            You are <b style={{ color: "var(--ink)" }}>1.4 km</b> from an international maritime boundary. Continuing on
            this heading will cross a restricted zone in roughly <b style={{ color: "var(--ink)" }}>9 minutes</b>.
          </div>
        </div>
        <div className="card">
          <div className="eyebrow-sm">Recommended action</div>
          <div className="txt-sm" style={{ marginTop: 5 }}>Turn to a heading of 240° or follow the suggested safe route back toward Zone B.</div>
        </div>
        <div className="row" style={{ gap: 9, marginTop: 12 }}>
          <button className="btn ghost" onClick={() => go("map")}>{t("title_map")}</button>
          <button className="btn primary" onClick={() => go("trip")}>{t("btn_safe_route")}</button>
        </div>
      </div>
    </Screen>
  );
}
