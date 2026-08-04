
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EnhancedResponsiveLayout } from './components/layout/EnhancedResponsiveLayout';
import { RouteErrorBoundary } from './components/error/RouteErrorBoundary';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { AuthPage } from './pages/AuthPage';
import { Toaster } from './components/ui/toaster';

// Lazy-load all page components to avoid module-level errors blocking the entire app
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const UploadBlueprint = React.lazy(() => import('./pages/UploadBlueprint').then(m => ({ default: m.UploadBlueprint })));
const ViewBlueprints = React.lazy(() => import('./pages/ViewBlueprints').then(m => ({ default: m.ViewBlueprints })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Users = React.lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const Compliance = React.lazy(() => import('./pages/Compliance').then(m => ({ default: m.Compliance })));
const ClientPortal = React.lazy(() => import('./pages/ClientPortal').then(m => ({ default: m.ClientPortal })));
const DocumentManagementDashboard = React.lazy(() => import('@/components/documents/DocumentManagementDashboard').then(m => ({ default: m.DocumentManagementDashboard })));
const Security = React.lazy(() => import('./pages/Security'));
const WorkflowAutomation = React.lazy(() => import('./pages/WorkflowAutomation'));
const GIS = React.lazy(() => import('./pages/GIS').then(m => ({ default: m.GIS })));
const Blueprint3D = React.lazy(() => import('./pages/Blueprint3D').then(m => ({ default: m.Blueprint3D })));
const Landing = React.lazy(() => import('./pages/Landing'));
const Home = React.lazy(() => import('./pages/Home'));
const OAuthConsent = React.lazy(() => import('./pages/OAuthConsent'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          return status >= 500 && failureCount < 3;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {

  return (
    <div data-app-loaded="true">
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Application-level error:', error, errorInfo);
          // Here you could send to error tracking service
        }}
      >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth routes - no protection needed */}
                <Route path="/auth/login" element={
                  <RouteErrorBoundary routeName="Authentication">
                    <AuthPage />
                  </RouteErrorBoundary>
                } />

                {/* Public landing page */}
                <Route path="/" element={
                  <RouteErrorBoundary routeName="Landing">
                    <Landing />
                  </RouteErrorBoundary>
                } />

                {/* Protected routes with error boundaries */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Home">
                      <EnhancedResponsiveLayout>
                        <Home />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Dashboard">
                      <EnhancedResponsiveLayout>
                        <Dashboard />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/blueprints/upload" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Blueprint Upload">
                      <EnhancedResponsiveLayout>
                        <UploadBlueprint />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/blueprint-3d" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Blueprint 3D">
                      <EnhancedResponsiveLayout>
                        <Blueprint3D />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/blueprints/view" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="View Blueprints">
                      <EnhancedResponsiveLayout>
                        <ViewBlueprints />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/compliance" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Compliance">
                      <EnhancedResponsiveLayout>
                        <Compliance />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/gis" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="GIS Analysis">
                      <EnhancedResponsiveLayout>
                        <GIS />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />


                <Route path="/client-portal" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Client Portal">
                      <EnhancedResponsiveLayout>
                        <ClientPortal />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Settings">
                      <EnhancedResponsiveLayout>
                        <Settings />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/users" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="User Management">
                      <EnhancedResponsiveLayout>
                        <Users />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/security" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Security">
                      <EnhancedResponsiveLayout>
                        <Security />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/workflow-automation" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Workflow Automation">
                      <EnhancedResponsiveLayout>
                        <WorkflowAutomation />
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />

                <Route path="/documents" element={
                  <ProtectedRoute>
                    <RouteErrorBoundary routeName="Document Management">
                      <EnhancedResponsiveLayout>
                        <div className="container mx-auto p-6">
                          <DocumentManagementDashboard />
                        </div>
                      </EnhancedResponsiveLayout>
                    </RouteErrorBoundary>
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster />
    </ErrorBoundary>
    </div>
  );
}

export default App;
