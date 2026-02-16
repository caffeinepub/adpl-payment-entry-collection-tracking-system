import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useCurrentUser } from './hooks/useCurrentUser';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import RawDataUploadPage from './pages/admin/RawDataUploadPage';
import PaymentEntryPage from './pages/payments/PaymentEntryPage';
import PaymentHistoryPage from './pages/payments/PaymentHistoryPage';
import EditPaymentEntryPage from './pages/payments/EditPaymentEntryPage';
import ReportsPage from './pages/reports/ReportsPage';
import AppLayout from './components/layout/AppLayout';
import ProfileSetupModal from './components/auth/ProfileSetupModal';
import AccessDeniedScreen from './components/auth/AccessDeniedScreen';
import { Toaster } from '@/components/ui/sonner';

function RootLayout() {
  const { identity } = useInternetIdentity();
  const { userProfile, isLoading: profileLoading, isFetched } = useCurrentUser();
  const isAuthenticated = !!identity;

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

function IndexComponent() {
  const { identity } = useInternetIdentity();
  const { userRole, isLoading } = useCurrentUser();

  if (!identity) {
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole === 'admin') {
    return <AdminDashboardPage />;
  }

  return <RawDataUploadPage />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: AdminDashboardPage,
});

const rawDataUploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoices',
  component: RawDataUploadPage,
});

const paymentEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-entry/$invoiceNumber',
  component: PaymentEntryPage,
});

const paymentHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-history/$retailerCode',
  component: PaymentHistoryPage,
});

function EditPaymentRouteComponent() {
  const { userRole } = useCurrentUser();
  if (userRole !== 'admin') {
    return <AccessDeniedScreen />;
  }
  return <EditPaymentEntryPage />;
}

const editPaymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/edit-payment/$paymentId',
  component: EditPaymentRouteComponent,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminDashboardRoute,
  rawDataUploadRoute,
  paymentEntryRoute,
  paymentHistoryRoute,
  editPaymentRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
