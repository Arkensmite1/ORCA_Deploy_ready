import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Icon, Segment, Tag, Toggle } from "./Shared";
import { dataSources, evidenceSources, explainPoints, safeLocations, sourceConflict } from "../mock";

function SheetShell({ id, children, center }) {
  const { sheet, toggleSheet } = useApp();
  return (
    <div className={`overlay ${sheet === id ? "show" : ""}`} onClick={(e) => e.target === e.currentTarget && toggleSheet(id, false)}>
      <div className="sheet" style={center ? { textAlign: "center" } : undefined}>
        <div className="sheet-handle"></div>
        {children}
      </div>
    </div>
  );
}

export default function Sheets() {
  const { toggleSheet, go, addPost, settings, updateSetting, summaryTrip, endTrip, cancelSos,
    contacts, addContact, deleteContact, callContact } = useApp();
  const [postText, setPostText] = useState("");
  const [postKind, setPostKind] = useState("hazard");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);

  return (
    <>
      <SheetShell id="voice" center>
        <div style={{ paddingBottom: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--teal-tint)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon.mic className="icon-lg" style={{ stroke: "var(--teal)" }} />
          </div>
          <div className="h-title">Listening…</div>
          <div className="txt-sm" style={{ marginTop: 6 }}>Speak in English, Hindi, or your regional language.</div>
          <button className="btn ghost section-gap" onClick={() => toggleSheet("voice", false)}>Cancel</button>
        </div>
      </SheetShell>

      <SheetShell id="explain">
        <div className="h-title">Why ORCA recommends this</div>
        <div className="txt-sm section-gap">
          {explainPoints.map((p, i) => <div key={i} style={{ marginBottom: 10 }}>{i + 1}. {p}</div>)}
        </div>
        <div className="txt-xs section-gap">Confidence: High · This explanation summarizes structured agent output — it is not a chat guess.</div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("explain", false)}>Close</button>
      </SheetShell>

      <SheetShell id="evidence">
        <div className="h-title">Evidence &amp; sources</div>
        <div className="section-gap">
          {evidenceSources.map((s) => (
            <div className="card" key={s.name} style={{ marginTop: 0, marginBottom: 10 }}>
              <div className="row"><span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{s.name}</span><Tag kind={s.tag === "REAL" ? "real" : "sim"}>{s.tag}</Tag></div>
              <div className="txt-xs" style={{ marginTop: 5 }}>{s.detail}</div>
            </div>
          ))}
          <div className="card" style={{ borderLeft: "3px solid var(--yellow)", marginTop: 0 }}>
            <div className="row">
              <span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{sourceConflict.title}</span>
              <span className="tag" style={{ background: "var(--yellow-tint)", color: "var(--yellow)" }}>RESOLVED</span>
            </div>
            <div className="txt-xs" style={{ marginTop: 6, lineHeight: 1.6 }}>
              {sourceConflict.a} &nbsp;·&nbsp; {sourceConflict.b}<br />{sourceConflict.resolution}
            </div>
          </div>
        </div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("evidence", false)}>Close</button>
      </SheetShell>

      <SheetShell id="layers">
        <div className="h-title">Map layers</div>
        <div className="txt-xs section-gap">Choose one focus layer at a time to keep the map readable.</div>
        <div className="col section-gap" style={{ gap: 8 }}>
          {[
            { k: "route", label: "Planned route" },
            { k: "pfz", label: "Potential fishing zones (PFZ)" },
            { k: "waveh", label: "Wave height" },
            { k: "windl", label: "Wind" },
            { k: "geof", label: "Geofences & boundaries" },
          ].map((l) => (
            <div className="row card" style={{ marginTop: 0 }} key={l.k}>
              <span className="txt-sm">{l.label}</span>
              <Toggle on={!!settings["layer_" + l.k] || l.k === "route"} onToggle={(v) => updateSetting("layer_" + l.k, v)} />
            </div>
          ))}
          <div className="row card" style={{ marginTop: 0 }}>
            <span className="txt-sm">SST / chlorophyll <Tag kind="sim" style={{ marginLeft: 4 }}>SIM</Tag></span>
            <Toggle on={!!settings.layer_sst} onToggle={(v) => updateSetting("layer_sst", v)} />
          </div>
        </div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("layers", false)}>Apply</button>
      </SheetShell>

      <SheetShell id="safeloc">
        <div className="h-title">Nearby safe locations</div>
        <div className="section-gap">
          {safeLocations.map((s) => (
            <div className="card" key={s.name} style={{ marginTop: 0, marginBottom: 10 }}>
              <div className="row"><span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{s.name}</span><Tag kind="real">{s.tag}</Tag></div>
              <div className="txt-xs" style={{ marginTop: 5 }}>{s.detail}</div>
            </div>
          ))}
        </div>
        <div className="txt-xs">Only locations verified through the safe-location registry are shown here.</div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("safeloc", false)}>Close</button>
      </SheetShell>

      <SheetShell id="endtrip" center>
        <div className="h-title">End this trip?</div>
        <div className="txt-sm section-gap">ORCA will stop continuous monitoring and generate a post-trip summary.</div>
        <button className="btn primary section-gap" onClick={() => { endTrip(); toggleSheet("endtrip", false); go("history"); }}>End trip</button>
        <button className="btn ghost section-gap" onClick={() => toggleSheet("endtrip", false)}>Keep monitoring</button>
      </SheetShell>

      <SheetShell id="cancelsos" center>
        <div className="h-title">Cancel emergency?</div>
        <div className="txt-sm section-gap">Only cancel if this was triggered by mistake and you are not in danger.</div>
        <button className="btn ghost-red section-gap" onClick={() => { cancelSos(); toggleSheet("cancelsos", false); go("trip"); }}>This was a mistake — cancel</button>
        <button className="btn sos section-gap" onClick={() => toggleSheet("cancelsos", false)}>No, I still need help</button>
      </SheetShell>

      <SheetShell id="newpost">
        <div className="h-title">Share an observation</div>
        <div className="section-gap">
          <Segment
            options={[{ value: "hazard", label: "Report hazard" }, { value: "general", label: "General post" }, { value: "poll", label: "Poll" }]}
            active={postKind}
            onChange={setPostKind}
          />
        </div>
        <textarea
          className="field section-gap"
          placeholder="Describe what you're seeing…"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
        <div className="txt-xs section-gap">Your approximate location and timestamp will be attached. Posts go through moderation before appearing widely.</div>
        <button
          className="btn primary section-gap"
          onClick={() => { addPost(postText, postKind); setPostText(""); toggleSheet("newpost", false); }}
        >Post</button>
      </SheetShell>

      <SheetShell id="summary">
        <div className="h-title">Post-trip summary</div>
        <div className="row section-gap"><span className="txt-xs">Duration</span><span className="txt-sm" style={{ fontWeight: 700 }}>{summaryTrip?.summary?.duration || "8h 40m"}</span></div>
        <div className="row"><span className="txt-xs">Distance</span><span className="txt-sm" style={{ fontWeight: 700 }}>{summaryTrip?.summary?.distance || "14.2 km"}</span></div>
        <div className="row"><span className="txt-xs">Alerts</span><span className="txt-sm" style={{ fontWeight: 700 }}>{summaryTrip?.summary?.alerts || "2 advisories"}</span></div>
        <div className="row"><span className="txt-xs">Emergencies</span><span className="txt-sm" style={{ fontWeight: 700, color: "var(--green)" }}>{summaryTrip?.summary?.emergencies || "None"}</span></div>
        <div className="hr"></div>
        <div className="txt-sm">{summaryTrip?.summary?.note || "Conditions stayed within forecast for most of the trip. Wind rose earlier than predicted around 1 PM — logged for future forecast comparison."}</div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("summary", false)}>Close</button>
      </SheetShell>

      <SheetShell id="contacts">
        <div className="h-title">Emergency contacts</div>
        <div className="section-gap">
          {contacts.map((c) => (
            <div className="card" key={c.id} style={{ marginTop: 0, marginBottom: 10 }}>
              <div className="row"><span className="txt-sm" style={{ fontWeight: 700, color: "var(--ink)" }}>{c.name}</span><span className="txt-xs">{c.role}</span></div>
              <div className="row" style={{ marginTop: 4 }}>
                <span className="txt-xs">{c.phone}</span>
                <div className="row" style={{ gap: 10, width: "auto" }}>
                  <span className="txt-xs" style={{ color: "var(--teal)", fontWeight: 700, cursor: "pointer" }} onClick={() => callContact(c.phone, c.name)}>Call</span>
                  <span className="txt-xs" style={{ color: "var(--red)", fontWeight: 700, cursor: "pointer" }} onClick={() => deleteContact(c.id)}>Remove</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showAddContact ? (
          <div className="card section-gap" style={{ marginTop: 0 }}>
            <input
              className="field" placeholder="Name" value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <input
              className="field" placeholder="Phone number" value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
            />
            <div className="row section-gap" style={{ gap: 8 }}>
              <button
                className="btn primary sm"
                onClick={() => {
                  addContact(newContactName, newContactPhone, "Contact");
                  setNewContactName(""); setNewContactPhone(""); setShowAddContact(false);
                }}
              >Save contact</button>
              <button className="btn ghost sm" onClick={() => setShowAddContact(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn ghost section-gap" onClick={() => setShowAddContact(true)}>+ Add contact</button>
        )}
      </SheetShell>

      <SheetShell id="datasrc">
        <div className="h-title">Data sources</div>
        <div className="section-gap">
          {dataSources.map((s) => (
            <div className="card" key={s.name} style={{ marginTop: 0, marginBottom: 10 }}>
              <div className="row"><span className="txt-sm">{s.name}</span><Tag kind={s.tag === "REAL" ? "real" : "sim"}>{s.tag}</Tag></div>
              <div className="txt-xs" style={{ marginTop: 4 }}>{s.detail}</div>
            </div>
          ))}
        </div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("datasrc", false)}>Close</button>
      </SheetShell>

      <SheetShell id="alertsettings">
        <div className="h-title">Alert preferences</div>
        <div className="col section-gap" style={{ gap: 8 }}>
          <div className="row card" style={{ marginTop: 0 }}><span className="txt-sm">Info</span><Toggle on={settings.alertInfo} onToggle={(v) => updateSetting("alertInfo", v)} /></div>
          <div className="row card" style={{ marginTop: 0 }}><span className="txt-sm">Advisory</span><Toggle on={settings.alertAdvisory} onToggle={(v) => updateSetting("alertAdvisory", v)} /></div>
          <div className="row card" style={{ marginTop: 0 }}><span className="txt-sm">Warning</span><Toggle on={settings.alertWarning} onToggle={(v) => updateSetting("alertWarning", v)} /></div>
          <div className="row card" style={{ marginTop: 0 }}><span className="txt-sm">Critical &amp; emergency</span><Toggle on locked /></div>
        </div>
        <div className="txt-xs section-gap">Critical and emergency alerts can't be turned off.</div>
        <button className="btn primary section-gap" onClick={() => toggleSheet("alertsettings", false)}>Save</button>
      </SheetShell>
    </>
  );
}
