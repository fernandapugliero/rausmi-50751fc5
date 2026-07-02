import ActivityResults from "./ActivityResults";
import { SEO } from "@/components/SEO";

const Morgen = () => (
  <>
    <SEO
      title="Morgen in Berlin mit Kindern – Aktivitäten & Termine | Rausmi"
      description="Plane den morgigen Tag: Krabbelgruppen, Kurse, Familientreffs und Veranstaltungen für Babys und Kleinkinder in Berlin."
      path="/morgen"
    />
    <ActivityResults defaultTimeRange="tomorrow" title="Morgen" />
  </>
);
export default Morgen;
