import React from "react";

/* Shared atoms mirroring the reference design system */

export const Icon = {
  back: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  chevron: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  bell: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  ),
  wind: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--teal-deep)" strokeWidth="2" {...props}>
      <path d="M3 8h11a3 3 0 100-6" />
      <path d="M3 16h15a3 3 0 110 6" />
    </svg>
  ),
  waves: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--teal-deep)" strokeWidth="2" {...props}>
      <path d="M2 12c3-4 6-4 9 0s6 4 9 0M2 18c3-4 6-4 9 0s6 4 9 0" />
    </svg>
  ),
  mic: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z" />
      <path d="M19 11a7 7 0 01-14 0M12 19v3" />
    </svg>
  ),
  send: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="var(--teal)" {...props}>
      <path d="M3 11l18-8-8 18-2-8-8-2z" />
    </svg>
  ),
  arrow: (props) => (
    <svg className="icon" style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  calendar: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--teal-deep)" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  map: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2" {...props}>
      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
    </svg>
  ),
  history: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5M12 7v5l4 2" />
    </svg>
  ),
  layers: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </svg>
  ),
  close: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  warn: (props) => (
    <svg className="icon-lg" viewBox="0 0 24 24" fill="var(--red)" {...props}>
      <path d="M12 2L2 21h20L12 2z" />
    </svg>
  ),
  warnWhite: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="#fff" {...props}>
      <path d="M12 2L2 21h20L12 2z" />
    </svg>
  ),
  plus: (props) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  logo: ({ size = 19 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 16c3-6 6-6 9 0s6 6 9 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M2 10c3-6 6-6 9 0s6 6 9 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".6" />
    </svg>
  ),
};

export function Badge({ tone = "green", children }) {
  return (
    <span className={`badge ${tone}`}>
      <span className="dot"></span>
      {children}
    </span>
  );
}

export function Tag({ kind = "sim", children, style }) {
  return <span className={`tag ${kind}`} style={style}>{children}</span>;
}

export function TopBar({ title, onBack, right, danger, warn: warnTone }) {
  const style = danger
    ? { background: "var(--red-tint)", borderBottomColor: "transparent" }
    : warnTone
      ? { background: "var(--orange-tint)", borderBottomColor: "transparent" }
      : undefined;
  return (
    <div className="topbar" style={style}>
      {onBack && (
        <div className="backbtn" onClick={onBack}>
          <Icon.back />
        </div>
      )}
      <h3 style={danger ? { color: "var(--red)" } : warnTone ? { color: "var(--orange)" } : undefined}>
        {title}
      </h3>
      {right}
    </div>
  );
}

/* The soft bathymetric map placeholder used across screens */
export function MapView({ height = 190, pins = ["you", "zone"], route = true, children, full }) {
  return (
    <div
      className="mapview"
      style={full ? { height: "calc(100% - 0px)", borderRadius: 0, border: "none" } : { height }}
    >
      <div className="grid"></div>
      <div className="land"></div>
      {route && <div className="route"></div>}
      {pins.includes("you") && <div className="pin you"></div>}
      {pins.includes("you") && <div className="ripple"></div>}
      {pins.includes("zone") && <div className="pin zone"></div>}
      {pins.includes("hazard") && <div className="pin hazard"></div>}
      {pins.includes("rescue") && <div className="pin rescue"></div>}
      {pins.includes("shelter") && <div className="pin shelter"></div>}
      {children}
    </div>
  );
}

export function Toggle({ on, onToggle, locked }) {
  return (
    <div
      className={`toggle ${on ? "on" : ""} ${locked ? "locked" : ""}`}
      onClick={() => !locked && onToggle && onToggle(!on)}
    >
      <div className="knob"></div>
    </div>
  );
}

export function Segment({ options, active, onChange }) {
  return (
    <div className="segment">
      {options.map((o) => (
        <div
          key={o.value}
          className={`seg ${active === o.value ? "on" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}

export function ChipRow({ options, active, onChange, style }) {
  return (
    <div className="scrollx" style={style}>
      {options.map((o) => (
        <span
          key={o}
          className={`chip ${active === o ? "on" : ""}`}
          onClick={() => onChange && onChange(o)}
        >
          {o}
        </span>
      ))}
    </div>
  );
}
