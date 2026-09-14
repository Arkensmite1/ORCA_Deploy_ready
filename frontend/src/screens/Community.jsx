import React from "react";
import Screen from "../components/Screen";
import { useApp } from "../context/AppContext";
import { Icon, Segment, Tag, TopBar } from "../components/Shared";

export default function Community() {
  const { toggleSheet, posts, markHelpful, reportPost, poll, pollVoted, votePoll, t } = useApp();
  const [tab, setTab] = React.useState("feed");

  return (
    <Screen id="community">
      <TopBar
        title={t("title_community")}
        right={<div className="iconbtn" onClick={() => toggleSheet("newpost", true)}><Icon.plus /></div>}
      />
      <div className="pad">
        <Segment
          options={[{ value: "feed", label: t("seg_feed") }, { value: "polls", label: t("seg_polls") }]}
          active={tab}
          onChange={setTab}
        />

        {tab === "feed" && (
          <div className="section-gap">
            {posts.map((p) => (
              <div className="card" key={p.id}>
                <div className="row">
                  <div className="row" style={{ gap: 8 }}>
                    <div className="avatar">{p.initials}</div>
                    <div className="col">
                      <span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{p.author}</span>
                      <span className="txt-xs">{p.verified ? "Verified" : "Unverified"} · {p.time}</span>
                    </div>
                  </div>
                  {p.tagClass === "sim" ? <Tag kind="sim">{p.tag}</Tag> : (
                    <span className="tag" style={{ background: `var(--${p.tagClass === "green" ? "green" : "orange"}-tint)`, color: `var(--${p.tagClass === "green" ? "green" : "orange"})` }}>{p.tag}</span>
                  )}
                </div>
                <div className="txt-sm" style={{ marginTop: 9 }}>{p.text}</div>
                <div className="row" style={{ marginTop: 9 }}>
                  <span
                    className="txt-xs"
                    style={{ cursor: "pointer", color: p.liked ? "var(--teal)" : undefined, fontWeight: p.liked ? 700 : 400 }}
                    onClick={() => markHelpful(p.id)}
                  >
                    👍 {p.helpful} found helpful
                  </span>
                  {p.reported ? (
                    <span className="txt-xs" style={{ color: "var(--ink-faint)" }}>Reported</span>
                  ) : (
                    <span className="txt-xs" style={{ color: "var(--teal)", fontWeight: 700, cursor: "pointer" }} onClick={() => reportPost(p.id)}>Report</span>
                  )}
                </div>
              </div>
            ))}
            <div className="card" style={{ borderLeft: "3px solid var(--ink-faint)" }}>
              <div className="txt-xs">Community reports are observations, not official warnings. Official advisories always take priority.</div>
            </div>
          </div>
        )}

        {tab === "polls" && (
          <div className="section-gap">
            <div className="card">
              <div className="h-title" style={{ fontSize: 13.5 }}>{poll.question}</div>
              <div className="txt-xs" style={{ marginTop: 4 }}>{poll.meta}{pollVoted && " · you voted"}</div>
              <div className="col" style={{ marginTop: 10, gap: 8 }}>
                {poll.options.map((o) => (
                  <div
                    key={o.id}
                    className={`poll-opt ${pollVoted === o.id ? "voted" : ""}`}
                    style={{ background: o.tint }}
                    onClick={() => votePoll(o.id)}
                  >
                    <span className="txt-sm">{o.label}{pollVoted === o.id && " ✓"}</span>
                    <span className="txt-xs" style={{ fontWeight: 700 }}>{o.pct}%</span>
                  </div>
                ))}
              </div>
              {!pollVoted && <div className="txt-xs" style={{ marginTop: 8 }}>Tap an option to vote</div>}
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}
