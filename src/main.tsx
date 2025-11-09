import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import './i18n'; // Initialize i18next
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
import { AdminPage } from '@/pages/AdminPage';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { FullPageLoader } from './components/FullPageLoader';
import { DanAiPage } from './pages/DanAiPage';
import { CropHealthAiPage } from './pages/CropHealthAiPage';
import { PaymentPage } from './pages/PaymentPage';
import { OrdersPage } from './pages/OrdersPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
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
      { path: "/orders", element: <OrdersPage /> },
      { path: "/pay/:orderId", element: <PaymentPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/education", element: <EducationHubPage /> },
      { path: "/education/:articleId", element: <ArticleDetailPage /> },
      { path: "/dan-ai", element: <DanAiPage /> },
      { path: "/crop-health-ai", element: <CropHealthAiPage /> },
      { path: "/create-listing", element: <CreateListingPage /> },
      {
        path: "/admin",
        element: (
          <ProtectedAdminRoute>
            <AdminPage />
          </ProtectedAdminRoute>
        )
      },
    ]
  }
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<FullPageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
)