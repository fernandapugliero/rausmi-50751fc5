import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Jetzt from "./pages/Jetzt";
import Heute from "./pages/Heute";
import Morgen from "./pages/Morgen";
import Datum from "./pages/Datum";
import ActivityDetail from "./pages/ActivityDetail";
import Admin from "./pages/Admin";
import EventEinreichen from "./pages/EventEinreichen";
import AktivitaetEinreichen from "./pages/AktivitaetEinreichen";
import KindercafeEinreichen from "./pages/KindercafeEinreichen";
import KindercafeDetail from "./pages/KindercafeDetail";
import UeberRausi from "./pages/UeberRausi";
import Konto from "./pages/Konto";
import Kontakt from "./pages/Kontakt";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — data stays fresh, no refetch
      gcTime: 15 * 60 * 1000,   // 15 min — keep in cache after unmount
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/jetzt" element={<Jetzt />} />
          <Route path="/heute" element={<Heute />} />
          <Route path="/morgen" element={<Morgen />} />
          <Route path="/datum" element={<Datum />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/event-einreichen" element={<EventEinreichen />} />
          <Route path="/aktivitaet-einreichen" element={<AktivitaetEinreichen />} />
          <Route path="/kindercafe-einreichen" element={<KindercafeEinreichen />} />
          <Route path="/kindercafe/:id" element={<KindercafeDetail />} />
          <Route path="/ueber" element={<UeberRausi />} />
          <Route path="/konto" element={<Konto />} />
          <Route path="/kontakt" element={<Kontakt />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
