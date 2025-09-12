import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "./lib/authClient";
import { Navigate } from "react-router-dom";
import AppHome from "./pages/app/AppHome";
import Chats from "./pages/app/Chats";
import Wallet from "./pages/app/Wallet";
import Rooms from "./pages/app/Rooms";
import Events from "./pages/app/Events";
import Business from "./pages/app/Business";
import Navigation from "./components/Navigation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { data, isLoading } = useQuery({ queryKey: ["session"], queryFn: authClient.session });
  if (isLoading) return null;
  if (!data?.user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<AppHome />} />
            <Route path="chats" element={<Chats />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="rooms" element={<Rooms />} />
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
