import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---- Ratnagiri coast (Arabian Sea) demo geography ----
export const GEO = {
  user: [16.994, 73.265],
  harbour: [16.983, 73.300],       // Ratnagiri Harbour (verified shelter)
  ganpatipule: [17.145, 73.265],   // Ganpatipule shelter
  zoneB: [16.965, 73.185],         // Fishing Zone B
  zoneA: [17.055, 73.190],
  zoneC: [16.905, 73.150],
  hazard: [17.045, 73.150],        // hazard / rough water
  rescue: [17.020, 73.225],        // rescue unit
  restricted: [                    // restricted maritime zone (NW, open sea)
    [17.13, 73.05], [17.20, 73.14], [17.10, 73.20], [17.02, 73.10],
  ],
};

const TILES = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Esri World Imagery",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  },
  nautical: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "OpenStreetMap",
  },
};

function pin(color, glyph = "", pulse = false) {
  return L.divIcon({
    className: "orca-pin-wrap",
    html: `<div class="orca-pin" style="--pc:${color}">${pulse ? '<span class="orca-pin-pulse" style="--pc:'+color+'"></span>' : ""}<span class="orca-pin-body" style="--pc:${color}">${glyph}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });
}

const ICON = {
  boat: '<svg viewBox="0 0 24 24" width="12" height="12" fill="#fff"><path d="M3 14h18l-2 5H5l-2-5zM12 3l6 9H6l6-9z"/></svg>',
  anchor: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.4"><circle cx="12" cy="5" r="2"/><path d="M12 7v13M6 13a6 6 0 0012 0M4 13h4M16 13h4"/></svg>',
  fish: '<svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><path d="M2 12s4-6 11-6c5 0 9 6 9 6s-4 6-9 6c-7 0-11-6-11-6z"/></svg>',
  warn: '<svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><path d="M12 3l10 18H2L12 3z"/></svg>',
  rescue: '<svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><path d="M11 3h2v6h6v2h-6v6h-2v-6H5V9h6V3z"/></svg>',
};

export default function LeafletMap({
  variant = "full",
  activeLayer = "Route",
  base = "satellite",
  height = 190,
  interactive = true,
  radius = false,
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const baseRef = useRef(null);
  const labelRef = useRef(null);
  const overlayRef = useRef(null);

  // init map once
  useEffect(() => {
    if (mapRef.current || !elRef.current) return;
    const focus = {
      full: { c: [17.02, 73.22], z: 11 },
      trip: { c: [16.98, 73.24], z: 12 },
      emergency: { c: GEO.user, z: 13 },
      rescue: { c: [17.007, 73.245], z: 13 },
      geofence: { c: [17.06, 73.18], z: 12 },
    }[variant] || { c: [17.02, 73.22], z: 11 };

    const map = L.map(elRef.current, {
      center: focus.c,
      zoom: focus.z,
      zoomControl: interactive && variant === "full",
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
    });
    mapRef.current = map;
    overlayRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 200);

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line
  }, []);

  // base tile switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (baseRef.current) map.removeLayer(baseRef.current);
    if (labelRef.current) { map.removeLayer(labelRef.current); labelRef.current = null; }
    const t = TILES[base] || TILES.satellite;
    baseRef.current = L.tileLayer(t.url, { maxZoom: 18 }).addTo(map);
    if (t.labels) {
      labelRef.current = L.tileLayer(t.labels, { maxZoom: 18, opacity: 0.9 }).addTo(map);
    }
  }, [base]);

  // draw markers + overlays whenever layer/variant changes
  useEffect(() => {
    const map = mapRef.current;
    const g = overlayRef.current;
    if (!map || !g) return;
    g.clearLayers();

    const addMarker = (pos, color, glyph, opts = {}) =>
      L.marker(pos, { icon: pin(color, glyph, opts.pulse) }).addTo(g);

    // Always: user boat
    addMarker(GEO.user, "#146FAE", ICON.boat, { pulse: true });

    if (variant === "geofence") {
      L.polygon(GEO.restricted, {
        color: "#EF5B57", weight: 2, dashArray: "6 6", fillColor: "#EF5B57", fillOpacity: 0.14,
      }).addTo(g);
      L.polyline([GEO.user, [17.09, 73.17]], { color: "#F0803F", weight: 3, dashArray: "2 8" }).addTo(g);
      addMarker(GEO.zoneB, "#2BAE73", ICON.fish);
      return;
    }

    if (variant === "emergency" || variant === "rescue") {
      L.circle(GEO.user, { radius: 700, color: "#EF5B57", weight: 1.5, fillColor: "#EF5B57", fillOpacity: 0.12 }).addTo(g);
      if (variant === "rescue") {
        addMarker(GEO.rescue, "#F0803F", ICON.rescue);
        L.polyline([GEO.rescue, GEO.user], { color: "#F0803F", weight: 3, dashArray: "6 6" }).addTo(g);
      }
      addMarker(GEO.harbour, "#F2A93B", ICON.anchor);
      return;
    }

    if (variant === "trip") {
      L.polyline([GEO.harbour, GEO.zoneB], { color: "#0B3C61", weight: 3, dashArray: "6 8" }).addTo(g);
      addMarker(GEO.harbour, "#F2A93B", ICON.anchor);
      addMarker(GEO.zoneB, "#2BAE73", ICON.fish);
      return;
    }

    // ---- full map: overlays per active layer ----
    addMarker(GEO.harbour, "#F2A93B", ICON.anchor);

    switch (activeLayer) {
      case "PFZ":
        [GEO.zoneA, GEO.zoneB, GEO.zoneC].forEach((z, i) => {
          L.circle(z, { radius: 2600, color: "#2BAE73", weight: 1.5, fillColor: "#2BAE73", fillOpacity: 0.18 }).addTo(g);
          addMarker(z, "#2BAE73", ICON.fish);
        });
        break;
      case "Waves":
        [[16.98, 73.18, 0.22], [17.06, 73.15, 0.34], [16.9, 73.12, 0.16]].forEach(([la, ln, op]) =>
          L.circle([la, ln], { radius: 3200, color: "#146FAE", weight: 0, fillColor: "#146FAE", fillOpacity: op }).addTo(g));
        break;
      case "Wind":
        [[17.05, 73.2], [16.95, 73.16], [17.1, 73.12], [16.88, 73.2]].forEach((p) =>
          L.marker(p, { icon: L.divIcon({ className: "wind-arrow", html: '<div class="wind-arrow-i">\u2197</div>', iconSize: [24, 24] }) }).addTo(g));
        break;
      case "Geofence":
        L.polygon(GEO.restricted, { color: "#EF5B57", weight: 2, dashArray: "6 6", fillColor: "#EF5B57", fillOpacity: 0.12 }).addTo(g);
        addMarker(GEO.hazard, "#EF5B57", ICON.warn);
        break;
      case "SST":
        [["#EF5B57", 17.08, 73.14], ["#F0803F", 16.98, 73.18], ["#EFB223", 16.9, 73.24], ["#2BAE73", 17.14, 73.28]].forEach(([c, la, ln]) =>
          L.circle([la, ln], { radius: 3000, color: c, weight: 0, fillColor: c, fillOpacity: 0.28 }).addTo(g));
        break;
      case "Route":
      default:
        L.polyline([GEO.harbour, GEO.user, GEO.zoneB], { color: "#0B3C61", weight: 3, dashArray: "6 8" }).addTo(g);
        addMarker(GEO.zoneB, "#2BAE73", ICON.fish);
        addMarker(GEO.hazard, "#EF5B57", ICON.warn);
        break;
    }
    if (radius) L.circle(GEO.user, { radius: 1500, color: "#146FAE", weight: 1, dashArray: "4 6", fillOpacity: 0.04 }).addTo(g);
  }, [activeLayer, variant, radius]);

  return <div ref={elRef} className="leaflet-shell" style={{ height, width: "100%" }} />;
}
