import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
 import { useUserRole } from "@/hooks/useUserRole";
 import { useToast } from "@/hooks/use-toast";
 import { useEffect } from "react";
import CharactersPage from "./pages/CharactersPage";
import PersonasPage from "./pages/PersonasPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import CanonPage from "./pages/CanonPage";
import SessionsPage from "./pages/SessionsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
 import AdminDashboardPage from "./pages/AdminDashboardPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

 function AdminRoute({ children }: { children: React.ReactNode }) {
   const { isAuthenticated, loading: authLoading } = useAuth();
   const { isAdmin, isLoading: roleLoading } = useUserRole();
   const { toast } = useToast();
 
   useEffect(() => {
     if (!authLoading && !roleLoading && isAuthenticated && !isAdmin) {
       toast({
         title: "Access Denied",
         description: "You don't have permission to access this page.",
         variant: "destructive",
       });
     }
   }, [authLoading, roleLoading, isAuthenticated, isAdmin, toast]);
 
   if (authLoading || roleLoading) {
     return (
       <div className="flex h-screen items-center justify-center bg-background">
         <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
       </div>
     );
   }
 
   if (!isAuthenticated) {
     return <Navigate to="/auth" replace />;
   }
 
   if (!isAdmin) {
     return <Navigate to="/" replace />;
   }
 
   return <>{children}</>;
 }
 
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public auth route */}
          <Route 
            path="/auth" 
            element={
              <AuthRoute>
                <AuthPage />
              </AuthRoute>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<CharactersPage />} />
                    <Route path="/personas" element={<PersonasPage />} />
                    <Route path="/chat/:characterId" element={<ChatPage />} />
                    <Route path="/sessions" element={<SessionsPage />} />
                    <Route path="/canon" element={<CanonPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                     <Route 
                       path="/admin" 
                       element={
                         <AdminRoute>
                           <AdminDashboardPage />
                         </AdminRoute>
                       } 
                     />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
