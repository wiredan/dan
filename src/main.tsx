import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage';
import { AppRoot } from '@/components/layout/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MarketplacePage } from '@/pages/MarketplacePage';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { OrderTrackingPage } from '@/pages/OrderTrackingPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { EducationHubPage } from '@/pages/EducationHubPage';
import { CreateListingPage } from '@/pages/CreateListingPage';
const router = createBrowserRouter([
  {
    element: <AppRoot />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/auth", element: <AuthPage /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/marketplace", element: <MarketplacePage /> },
      { path: "/listing/:id", element: <ListingDetailPage /> },
      { path: "/order/:id", element: <OrderTrackingPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/education", element: <EducationHubPage /> },
      { path: "/create-listing", element: <CreateListingPage /> },
    ]
  }
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)