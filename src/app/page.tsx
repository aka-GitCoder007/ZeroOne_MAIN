"use client";

import { useState, useEffect } from "react";
import CustomerMode from "./components/CustomerMode";
import AdminMode from "./components/AdminMode";
import IntroAnimation from "./components/IntroAnimation";
import "./page.css";

export default function Home() {
  const [showIntro, setShowIntro] = useState(false); // Default false to prevent flash
  const [mode, setMode] = useState<"customer" | "admin">("customer");

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true");
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <main className="app-container">
      {/* Global Dynamic Animated Background */}
      <div className="ambient-background">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      {/* Hidden toggle for Admin (click top right corner) */}
      <div 
        className="admin-toggle-secret"
        onClick={() => setMode(mode === "customer" ? "admin" : "customer")}
        title="Toggle Admin Mode"
      ></div>

      {mode === "customer" ? (
        <CustomerMode />
      ) : (
        <AdminMode onLogout={() => setMode("customer")} />
      )}
    </main>
  );
}
