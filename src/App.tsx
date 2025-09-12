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
import Groups from "./pages/app/Groups";
import Media from "./pages/app/Media";
import Events from "./pages/app/Events";
import Business from "./pages/app/Business";
import Navigation from "./components/Navigation";

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
            <Route path="groups" element={<Groups />} />
            <Route path="media" element={<Media />} />
            <Route path="events" element={<Events />} />
            <Route path="business" element={<Business />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
