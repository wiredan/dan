import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/lib/authStore";
type AppLayoutProps = {
  children: React.ReactNode;
};
// This is the main layout for pages that need Navbar and Footer
export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <Toaster richColors closeButton />
    </div>
  );
}
// This is the root layout component for the router
export const AppRoot = () => {
  const checkAuth = useAuthStore(s => s.checkAuth);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
};