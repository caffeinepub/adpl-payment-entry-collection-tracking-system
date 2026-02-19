import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, Navigate } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useCurrentUser } from './hooks/useCurrentUser';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import RawDataUploadPage from './pages/admin/RawDataUploadPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PaymentEntryPage from './pages/payments/PaymentEntryPage';
import BatchPaymentEntryPage from './pages/payments/BatchPaymentEntryPage';
import PaymentHistoryPage from './pages/payments/PaymentHistoryPage';
import EditPaymentEntryPage from './pages/payments/EditPaymentEntryPage';
import ReportsPage from './pages/reports/ReportsPage';
import AppLayout from './components/layout/AppLayout';
import AccessDeniedScreen from './components/auth/AccessDeniedScreen';
import { Toaster } from '@/components/ui/sonner';

function RootLayout() {
  return (
    <>
      <AppLayout>
        <Outlet />
      </AppLayout>
      <Toaster />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

function IndexComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { userRole, isLoading } = useCurrentUser();

  // Show loading while checking authentication
  if (isInitializing || (identity && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!identity) {
    return <LoginPage />;
  }

  // Authenticated - redirect based on role
  if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }

  return <Navigate to="/invoices" />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
});

function AdminDashboardRouteComponent() {
  const { identity } = useInternetIdentity();
  const { userRole, isLoading } = useCurrentUser();

  if (!identity) {
    return <Navigate to="/" />;
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

  if (userRole !== 'admin') {
    return <AccessDeniedScreen />;
  }

  return <AdminDashboardPage />;
}

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/dashboard',
  component: AdminDashboardRouteComponent,
});

function UserManagementRouteComponent() {
  const { identity } = useInternetIdentity();
  const { userRole, isLoading } = useCurrentUser();

  if (!identity) {
    return <Navigate to="/" />;
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

  if (userRole !== 'admin') {
    return <AccessDeniedScreen />;
  }

  return <UserManagementPage />;
}

const userManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/users',
  component: UserManagementRouteComponent,
});

function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  const { identity } = useInternetIdentity();
  const { isLoading } = useCurrentUser();

  if (!identity) {
    return <Navigate to="/" />;
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

  return <>{children}</>;
}

const rawDataUploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invoices',
  component: () => (
    <ProtectedRouteWrapper>
      <RawDataUploadPage />
    </ProtectedRouteWrapper>
  ),
});

const paymentEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-entry/$invoiceNumber',
  component: () => (
    <ProtectedRouteWrapper>
      <PaymentEntryPage />
    </ProtectedRouteWrapper>
  ),
});

const batchPaymentEntryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/batch-payment-entry',
  component: () => (
    <ProtectedRouteWrapper>
      <BatchPaymentEntryPage />
    </ProtectedRouteWrapper>
  ),
});

const paymentHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-history/$retailerCode',
  component: () => (
    <ProtectedRouteWrapper>
      <PaymentHistoryPage />
    </ProtectedRouteWrapper>
  ),
});

function EditPaymentRouteComponent() {
  const { identity } = useInternetIdentity();
  const { userRole, isLoading } = useCurrentUser();

  if (!identity) {
    return <Navigate to="/" />;
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
  component: () => (
    <ProtectedRouteWrapper>
      <ReportsPage />
    </ProtectedRouteWrapper>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminDashboardRoute,
  userManagementRoute,
  rawDataUploadRoute,
  paymentEntryRoute,
  batchPaymentEntryRoute,
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
