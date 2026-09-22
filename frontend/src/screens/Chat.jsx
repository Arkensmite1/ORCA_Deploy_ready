import React, { useEffect, useRef, useState } from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Badge, Icon, Tag, TopBar } from "../components/Shared";
import { agentSteps } from "../mock";

function OrcaMessage({ m }) {
  const { go } = useApp();
  if (m.kind === "note") {
    return <div className="txt-xs" style={{ marginTop: 8 }}>{m.text}</div>;
  }
  if (m.kind === "risk-card") {
    return (
      <div className="card section-gap" style={{ borderLeft: `3px solid var(--${m.tone || "green"})`, cursor: "pointer" }} onClick={() => go("risk")}>
        <Badge tone={m.tone || "green"}>{m.badge}</Badge>
        <div className="h-title" style={{ marginTop: 9, fontSize: 14 }}>{m.title}</div>
        <div className="txt-sm" style={{ marginTop: 7 }}>
          {m.bullets.map((b, i) => <div key={i}>• {b}</div>)}
        </div>
        {m.watch && <div className="txt-xs" style={{ marginTop: 8 }}>{m.watch}</div>}
        <div className="row" style={{ marginTop: 10 }}>
          <span className="txt-xs">{m.updated}</span>
          <span className="txt-xs" style={{ color: "var(--teal)", fontWeight: 700 }}>View full assessment →</span>
        </div>
      </div>
    );
  }
  // simple card answer
  return (
    <div className="card section-gap">
      {m.langTag && <div className="row" style={{ marginBottom: 6 }}><Tag kind="real">{m.langTag}</Tag></div>}
      {m.badge && <div style={{ marginBottom: 8 }}><Badge tone={m.tone || "green"}>{m.badge}</Badge></div>}
      <div className="txt-sm" style={{ whiteSpace: "pre-line" }}>{m.text}</div>
    </div>
  );
}

export default function Chat() {
  const { go, toggleSheet, messages, agentBusy, agentStep, sendMessage, t } = useApp();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, agentBusy, agentStep]);

  const send = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  };

  return (
    <Screen id="chat" style={{ display: "flex", flexDirection: "column" }}>
      <TopBar
        title={t("title_ask")}
        onBack={() => go("home")}
        right={<div className="iconbtn" onClick={() => toggleSheet("voice", true)}><Icon.mic /></div>}
      />
      <div className="pad" ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {messages.map((m, i) =>
          m.from === "user" ? (
            <div className="bubble-row right" key={i}>
              <div className="bubble-user">{m.text}</div>
            </div>
          ) : (
            <OrcaMessage key={i} m={m} />
          )
        )}
        {agentBusy && (
          <div className="card section-gap" style={{ borderLeft: "3px solid var(--teal)" }}>
            <div className="agent-working">
              <span className="typing-dots"><span /><span /><span /></span>
              {agentSteps[agentStep]}
            </div>
            <div className="txt-xs" style={{ marginTop: 6 }}>Structured agent run — not a chatbot guess</div>
          </div>
        )}
      </div>
      <div className="pad" style={{ paddingTop: 0, background: "var(--surface-alt)" }}>
        <div className="row" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 24, padding: "9px 9px 9px 15px" }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("msg_placeholder")}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, fontFamily: "var(--font-body)", color: "var(--ink)" }}
          />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ display: "flex", cursor: "pointer" }} onClick={() => toggleSheet("voice", true)}>
              <Icon.mic style={{ stroke: "var(--ink-faint)" }} />
            </span>
            <span style={{ display: "flex", cursor: "pointer" }} onClick={send}>
              <Icon.send />
            </span>
          </div>
        </div>
      </div>
    </Screen>
  );
}
