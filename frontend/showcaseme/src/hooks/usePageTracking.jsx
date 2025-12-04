import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Every time the route changes, send a small POST
    fetch("/api/track-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // includes session cookie if logged in
      body: JSON.stringify({ path: location.pathname }),
    }).catch((err) => {
      console.error("Failed to log page view", err);
    });
  }, [location.pathname]);
}