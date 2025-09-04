import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Header } from "@/components/Header";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import TestSeries from "./pages/TestSeries";
import StudyMaterials from "./pages/StudyMaterials";
import PolityApp from "./components/study-material/polity/PolityApp";
import PolityTest from "./pages/PolityTest";
import SubjectTest from "./pages/SubjectTest";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import TestSeriesTest from "./pages/TestSeriesTest";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test-series" element={<TestSeries />} />
            <Route path="/test-series/:subjectId" element={<SubjectTest />} />
            <Route path="/test/:testId" element={<TestSeriesTest />} />
            <Route path="/polity-test" element={<PolityTest />} />
            <Route path="/study-materials" element={<StudyMaterials />} />
            <Route path="/study-materials/polity" element={<PolityApp />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
