import ActivityResults from "./ActivityResults";
import { SEO } from "@/components/SEO";

const Heute = () => (
  <>
    <SEO
      title="Heute in Berlin mit Kindern – Aktivitäten & Termine | Rausmi"
      description="Alle familienfreundlichen Aktivitäten, Kurse und offenen Treffs für Kinder in Berlin heute – nach Uhrzeit und Bezirk filterbar."
      path="/heute"
    />
    <ActivityResults defaultTimeRange="today" title="Heute" />
  </>
);
export default Heute;
