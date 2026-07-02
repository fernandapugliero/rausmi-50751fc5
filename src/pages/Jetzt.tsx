import ActivityResults from "./ActivityResults";
import { SEO } from "@/components/SEO";

const Jetzt = () => (
  <>
    <SEO
      title="Jetzt geöffnet – Aktivitäten mit Kindern in Berlin | Rausmi"
      description="Was läuft gerade für Kinder in Berlin? Finde spontane, familienfreundliche Aktivitäten, Krabbelgruppen und offene Treffs, die jetzt geöffnet sind."
      path="/jetzt"
    />
    <ActivityResults defaultTimeRange="now" title="Jetzt verfügbar" />
  </>
);
export default Jetzt;
