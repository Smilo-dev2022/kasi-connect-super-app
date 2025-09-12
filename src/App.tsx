import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import AppHome from "./pages/app/AppHome";
import Chats from "./pages/app/Chats";
import Wallet from "./pages/app/Wallet";
import Rooms from "./pages/app/Rooms";
import Events from "./pages/app/Events";
import Business from "./pages/app/Business";
import Navigation from "./components/Navigation";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Guidelines from "./pages/Guidelines";
import ConsentBanner from "./components/ConsentBanner";
import Security from "./pages/Security";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppHome />} />
            <Route path="chats" element={<Chats />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="events" element={<Events />} />
            <Route path="business" element={<Business />} />
          </Route>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/security" element={<Security />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ConsentBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
