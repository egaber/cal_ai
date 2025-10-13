import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { RTLProvider } from "@/contexts/RTLContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ResponsiveLayout from "./components/ResponsiveLayout";
import Welcome from "./pages/Welcome";
import { UserProfile } from "./types/user";
import { onAuthStateChange } from "./services/authService";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <RTLProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Welcome onAuthenticated={setUser} />
          </TooltipProvider>
        </RTLProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RTLProvider>
        <AuthProvider user={user}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ResponsiveLayout />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </RTLProvider>
    </QueryClientProvider>
  );
};

export default App;
