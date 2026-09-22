import React from "react";
import { useApp } from "../context/AppContext";

/* Wrapper that mirrors .screen show/hide behaviour of the reference design */
export default function Screen({ id, children, style }) {
  const { screen } = useApp();
  return (
    <section className={`screen ${screen === id ? "active" : ""}`} id={`scr-${id}`} style={style}>
      {children}
    </section>
  );
}
