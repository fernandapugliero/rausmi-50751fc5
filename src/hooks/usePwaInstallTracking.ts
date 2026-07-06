import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type EventType =
  | "prompt_shown"
  | "prompt_accepted"
  | "prompt_dismissed"
  | "installed"
  | "standalone_open";

const SESSION_KEY = "rausmi_pwa_standalone_logged";

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows/i.test(ua)) return "windows";
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/linux/i.test(ua)) return "linux";
  return "other";
}

async function logEvent(event_type: EventType) {
  try {
    await supabase.from("pwa_install_events").insert({
      event_type,
      platform: detectPlatform(),
      user_agent: navigator.userAgent.slice(0, 500),
    });
  } catch {
    // silent — telemetry must never break the app
  }
}

export function usePwaInstallTracking() {
  useEffect(() => {
    // Log standalone opens once per session (iOS + Android installed apps)
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone && !sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, "1");
      logEvent("standalone_open");
    }

    const onBeforeInstallPrompt = () => {
      logEvent("prompt_shown");
    };

    const onAppInstalled = () => {
      logEvent("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);
}
