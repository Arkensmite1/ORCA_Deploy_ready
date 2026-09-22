import React from "react";
import "./orca.css";
import { AppProvider } from "./context/AppContext";
import AppShell from "./components/AppShell";
import Sheets from "./components/Sheets";
import { Splash, Onboard, Login } from "./screens/Onboarding";
import Landing from "./screens/Landing";
import Home from "./screens/Home";
import Chat from "./screens/Chat";
import { Risk, Trace } from "./screens/Risk";
import { MapScreen, Trip, Geofence } from "./screens/MapTrip";
import { Plan, Alerts } from "./screens/PlanAlerts";
import Community from "./screens/Community";
import { Emergency, Rescue, SosConfirm } from "./screens/Emergency";
import { History, Profile, Settings, Demo } from "./screens/Profile";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" />
      <AppShell>
        <Landing />
        <Splash />
        <Onboard id="onboard1" />
        <Onboard id="onboard2" />
        <Onboard id="onboard3" />
        <Login />
        <Home />
        <Chat />
        <Risk />
        <Trace />
        <MapScreen />
        <Trip />
        <Geofence />
        <Plan />
        <Alerts />
        <Community />
        <Emergency />
        <Rescue />
        <SosConfirm />
        <History />
        <Profile />
        <Settings />
        <Demo />
        <Sheets />
      </AppShell>
    </AppProvider>
  );
}

export default App;
