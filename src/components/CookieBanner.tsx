import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "rausmi-cookie-ack-v1";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // small delay so it doesn't flash before hydration
        const t = setTimeout(() => setVisible(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie-Hinweis"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-background/95 backdrop-blur shadow-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-sm text-foreground/90 leading-relaxed">
            <p>
              Diese Seite verwendet ausschließlich technisch notwendige Cookies
              (z. B. für Login und Sitzung). Keine Tracking- oder Marketing-Cookies.{" "}
              <Link
                to="/datenschutz"
                className="underline underline-offset-2 hover:text-primary"
              >
                Mehr erfahren
              </Link>
              .
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Schließen"
            className="text-muted-foreground hover:text-foreground shrink-0 -m-1 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={dismiss} className="rounded-full px-5">
            Verstanden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
