import React from "react";
import { useApp } from "../context/AppContext";
import { Icon } from "./Shared";

const sidebarItems = [
  {
    tab: "home", label: "Mission overview", target: "home",
    svg: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  },
  {
    tab: "chat", label: "Ask ORCA", target: "chat",
    svg: <><path d="M4 5h16v11H8l-4 4V5z" /></>,
  },
  {
    tab: "risk", label: "Risk assessment", target: "risk",
    svg: <><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" /></>,
  },
  {
    tab: "map", label: "Trip & map", target: "map",
    svg: <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />,
  },
  {
    tab: "plan", label: "7-day plan", target: "plan",
    svg: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  },
  {
    tab: "community", label: "Community", target: "community",
    svg: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-1a5 5 0 015-5h4a5 5 0 015 5v1" /><circle cx="17" cy="7.5" r="2.3" /><path d="M16.5 13.2c1.9.3 3.5 1.8 3.5 4.2V21" /></>,
  },
  {
    tab: "profile", label: "Profile & settings", target: "profile",
    svg: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6" /></>,
  },
];

export function OrcaMark() {
  return (
    <div className="mark" data-testid="orca-logo">
      <img src="/orca-logo.png" alt="ORCA" />
    </div>
  );
}

function Sidebar() {
  const { go, navMap, screen, conditions, profile, t } = useApp();
  const activeTab = navMap[screen] || screen;
  const alertsActive = (conditions && conditions.alertsActive) || 0;
  const initials = (profile.name || "RK").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-top">
        <div className="brand-block" onClick={() => go("home")} role="button" tabIndex={0}>
          <OrcaMark />
          <div className="wordmark">ORCA<small>Marine Intelligence &amp; Safety</small></div>
        </div>
      </div>

      <nav className="dash-nav">
        <div className="dash-nav-label">Command center</div>
        {sidebarItems.map((n) => (
          <button
            key={n.tab}
            data-tab={n.tab}
            className={`dash-navitem ${activeTab === n.tab ? "active" : ""}`}
            onClick={() => go(n.target)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{n.svg}</svg>
            <span>{n.label}</span>
          </button>
        ))}
        <button
          className={`dash-navitem ${activeTab === "alerts" || screen === "alerts" ? "active" : ""}`}
          onClick={() => go("alerts")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          <span>Risk alerts</span>
          {alertsActive > 0 && <span className="dash-nav-badge">{alertsActive}</span>}
        </button>
      </nav>

      <div className="dash-sidebar-spacer" />

      <button className="dash-sos" onClick={() => go("sosconfirm")}>
        <Icon.warnWhite /> SOS — Emergency
      </button>

      <div className="dash-sidebar-foot">
        <span className="pulse" />
        <div>
          <b>ORCA Sentinel</b>
          <div>Continuous monitoring active for {profile.homePort || "your coast"}.</div>
        </div>
      </div>

      <div className="dash-sidebar-user" onClick={() => go("profile")} role="button" tabIndex={0}>
        <div className="avatar">{initials}</div>
        <div className="col">
          <span className="h-title" style={{ fontSize: 12.5, color: "#fff" }}>{profile.name}</span>
          <span className="txt-xs" style={{ color: "#9FB4CC" }}>{profile.vessel}</span>
        </div>
      </div>
    </aside>
  );
}

function DashTopbar() {
  const { go, screen, t } = useApp();
  const titles = {
    home: "Mission overview", chat: t("title_ask"), risk: t("title_risk"), trace: t("title_trace"),
    map: t("title_map"), trip: t("title_trip"), plan: t("title_plan"), alerts: t("title_alerts"),
    community: t("title_community"), history: t("title_history"), profile: t("title_profile"),
    settings: t("title_settings"), demo: t("title_demo"), geofence: t("title_geofence"),
  };
  const title = titles[screen] || "ORCA";
  return (
    <header className="dash-topbar">
      <div className="dash-topbar-title">
        <span className="live-dot" />
        <span>{title}</span>
      </div>
      <div className="dash-topbar-actions">
        <span className="tag real dash-realtag">REAL + SIM DATA</span>
        <button className="nav-icon-btn" onClick={() => go("alerts")} aria-label="Alerts">
          <Icon.bell />
        </button>
        <button className="nav-icon-btn" onClick={() => go("profile")} aria-label="Profile">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6" /></svg>
        </button>
      </div>
    </header>
  );
}

function BottomNav() {
  const { go, navMap, screen, t } = useApp();
  const activeTab = navMap[screen];
  const items = sidebarItems.filter((n) => ["home", "plan", "map", "community", "profile"].includes(n.tab));
  return (
    <nav className="bottomnav">
      {items.map((n) => (
        <button
          key={n.tab}
          data-tab={n.tab}
          className={`navitem ${activeTab === n.tab ? "active" : ""}`}
          onClick={() => go(n.target)}
        >
          <span className="navdot"></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{n.svg}</svg>
          <span>{t("nav_" + n.tab)}</span>
        </button>
      ))}
    </nav>
  );
}

export default function AppShell({ children }) {
  const { screen, go, noChromeScreens, noFabScreens } = useApp();
  const showChrome = !noChromeScreens.includes(screen);

  if (!showChrome) {
    return (
      <div className="orca-root auth-mode">
        <div className="app-body">
          <div className="app-canvas">
            <div className="screens">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  const showFab = !noFabScreens.includes(screen);

  return (
    <div className="orca-root dash-mode">
      <div className="dash-shell">
        <Sidebar />
        <div className="dash-main">
          <DashTopbar />
          <div className="dash-content">
            <div className="screens">{children}</div>
            {showFab && (
              <div className="sos-fab" onClick={() => go("sosconfirm")}>SOS</div>
            )}
          </div>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
