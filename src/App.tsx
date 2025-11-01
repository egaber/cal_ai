import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { RTLProvider } from "@/contexts/RTLContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { EventProvider } from "@/contexts/EventContext";
import { SkinProvider } from "@/skins/SkinContext";
import ResponsiveLayout from "./components/ResponsiveLayout";
import Welcome from "./pages/Welcome";
import { FamilySetupDialog } from "./components/FamilySetupDialog";
import { UserProfile } from "./types/user";
import { onAuthStateChange, updateUserProfile } from "./services/authService";
import { Family } from "./services/familyService";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFamilySetup, setShowFamilySetup] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);
  const [inviteRole, setInviteRole] = useState<'parent' | 'child' | undefined>(undefined);

  useEffect(() => {
    // Read URL parameters for invite code
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    const role = params.get('role');
    
    if (invite) {
      setInviteCode(invite.toUpperCase());
      setInviteRole(role === 'child' ? 'child' : 'parent');
    }
  }, []);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      
      // Show family setup if user is authenticated but has no familyId
      if (user && !user.familyId) {
        setShowFamilySetup(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFamilySetupComplete = async (family: Family) => {
    if (user) {
      // Update user profile with familyId
      await updateUserProfile(user.uid, { familyId: family.id });
      
      // Update local user state
      setUser({ ...user, familyId: family.id });
      setShowFamilySetup(false);
    }
  };

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
      <SkinProvider>
        <RTLProvider>
          <AuthProvider user={user}>
          <FamilyProvider>
            <EventProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {showFamilySetup && (
                  <FamilySetupDialog
                    open={showFamilySetup}
                    user={user}
                    onComplete={handleFamilySetupComplete}
                    initialInviteCode={inviteCode}
                    initialRole={inviteRole}
                  />
                )}
                <BrowserRouter>
                  <ResponsiveLayout />
                </BrowserRouter>
              </TooltipProvider>
            </EventProvider>
          </FamilyProvider>
        </AuthProvider>
      </RTLProvider>
      </SkinProvider>
    </QueryClientProvider>
  );
};

export default App;
