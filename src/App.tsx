
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EnhancedResponsiveLayout } from './components/layout/EnhancedResponsiveLayout';
import { RouteErrorBoundary } from './components/error/RouteErrorBoundary';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { UploadBlueprint } from './pages/UploadBlueprint';
import { ViewBlueprints } from './pages/ViewBlueprints';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { Compliance } from './pages/Compliance';
import { FEAAnalysis } from './pages/FEAAnalysis';
import { Analytics } from './pages/Analytics';
import { ClientPortal } from './pages/ClientPortal';
import { Testing } from './pages/Testing';
import { DocumentManagementDashboard } from '@/components/documents/DocumentManagementDashboard';
import Security from './pages/Security';
import WorkflowAutomation from './pages/WorkflowAutomation';
import { GIS } from './pages/GIS';
import { AuthPage } from './pages/AuthPage';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors, but retry on network errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = error.status as number;
            return status >= 500 && failureCount < 3;
          }
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Application-level error:', error, errorInfo);
        // Here you could send to error tracking service
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth routes - no protection needed */}
              <Route path="/auth/login" element={
                <RouteErrorBoundary routeName="Authentication">
                  <AuthPage />
                </RouteErrorBoundary>
              } />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Protected routes with error boundaries */}
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
              
              <Route path="/fea-analysis" element={
                <ProtectedRoute>
                  <RouteErrorBoundary routeName="FEA Analysis">
                    <EnhancedResponsiveLayout>
                      <FEAAnalysis />
                    </EnhancedResponsiveLayout>
                  </RouteErrorBoundary>
                </ProtectedRoute>
              } />
              
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <RouteErrorBoundary routeName="Analytics">
                    <EnhancedResponsiveLayout>
                      <Analytics />
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
              
              <Route path="/testing" element={
                <ProtectedRoute>
                  <RouteErrorBoundary routeName="Testing">
                    <EnhancedResponsiveLayout>
                      <Testing />
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
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
