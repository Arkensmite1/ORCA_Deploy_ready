import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Icon } from "./Shared";

const navItems = [
  {
    tab: "home", label: "Home", target: "home",
    svg: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  },
  {
    tab: "plan", label: "Plan", target: "plan",
    svg: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  },
  {
    tab: "map", label: "Map", target: "map",
    svg: <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />,
  },
  {
    tab: "community", label: "Community", target: "community",
    svg: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-1a5 5 0 015-5h4a5 5 0 015 5v1" /><circle cx="17" cy="7.5" r="2.3" /><path d="M16.5 13.2c1.9.3 3.5 1.8 3.5 4.2V21" /></>,
  },
  {
    tab: "profile", label: "Profile", target: "profile",
    svg: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6" /></>,
  },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  let h = now.getHours() % 12;
  if (h === 0) h = 12;
  const m = now.getMinutes().toString().padStart(2, "0");
  return <span>{h}:{m}</span>;
}

export function BrandSide() {
  return (
    <div className="brand-side">
      <div className="brand-eyebrow"><span className="pulse"></span>LIVE PROTOTYPE — TAP TO NAVIGATE</div>
      <h1>ORCA doesn't stop at the first answer.</h1>
      <p>
        Marine EcOsystem Reasoning with Collaborative Agents — a working front-end
        walkthrough of the full PLAN → MONITOR → RESPOND lifecycle, built for
        Problem Statement 26176.
      </p>
      <div className="brand-legend">
        <div className="item"><span className="sw" style={{ background: "var(--green)" }}></span>Green — low risk, proceed</div>
        <div className="item"><span className="sw" style={{ background: "var(--yellow)" }}></span>Yellow — moderate, watch</div>
        <div className="item"><span className="sw" style={{ background: "var(--orange)" }}></span>Orange — high, caution</div>
        <div className="item"><span className="sw" style={{ background: "var(--red)" }}></span>Red — critical / emergency</div>
      </div>
      <div className="brand-tap">
        <b>Try this:</b> Open Profile → Demo control panel to jump through the whole
        PLAN → MONITOR → EMERGENCY → RESCUE story. Or ask ORCA a question, view its
        Agent trace, then hold the SOS button for 3 seconds to see the confirmation flow.
      </div>
    </div>
  );
}

export default function PhoneShell({ children }) {
  const { screen, go, navMap, noChromeScreens, noFabScreens, t } = useApp();
  const showChrome = !noChromeScreens.includes(screen);
  const showFab = showChrome && !noFabScreens.includes(screen);
  const activeTab = navMap[screen];

  return (
    <div className="phone-outer">
      <div className="phone">
        <div className="island"></div>
        <div className="statusbar">
          <Clock />
          <div className="icons">●●●&nbsp;&nbsp;5G&nbsp;&nbsp;▮▮▮</div>
        </div>

        <div className="screens">{children}</div>

        {showFab && (
          <div className="sos-fab" onClick={() => go("sosconfirm")}>SOS</div>
        )}

        {showChrome && (
          <nav className="bottomnav">
            {navItems.map((n) => (
              <button
                key={n.tab}
                data-tab={n.tab}
                className={`navitem ${activeTab === n.tab ? "active" : ""}`}
                onClick={() => go(n.target)}
              >
                <span className="navdot"></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {n.svg}
                </svg>
                <span>{t("nav_" + n.tab)}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

export function OrcaMark() {
  return (
    <div className="mark">
      <Icon.logo />
    </div>
  );
}
