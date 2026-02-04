import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import LiveAnalysis from "./pages/LiveAnalysis";
import StintAnalysis from "./pages/StintAnalysis";
import Team from "./pages/Team";
import RaceImport from "./pages/RaceImport";
import Settings from "./pages/Settings";
import Spectator from "./pages/Spectator";
import OnboardPage from "./pages/OnboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/spectator/:sessionId" element={<Spectator />} />
          <Route path="/onboard" element={<OnboardPage />} />
          <Route path="/onboard/:kartNumber" element={<OnboardPage />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Header />
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/live" element={
            <ProtectedRoute>
              <Header />
              <LiveAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/stints" element={
            <ProtectedRoute>
              <Header />
              <StintAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <Header />
              <Team />
            </ProtectedRoute>
          } />
          <Route path="/import" element={
            <ProtectedRoute>
              <Header />
              <RaceImport />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Header />
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
