
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EnhancedResponsiveLayout } from './components/layout/EnhancedResponsiveLayout';
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
import { AuthPage } from './pages/AuthPage';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route path="/auth/login" element={<AuthPage />} />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Dashboard />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/blueprints/upload" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <UploadBlueprint />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/blueprints/view" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <ViewBlueprints />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/compliance" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Compliance />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/fea-analysis" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <FEAAnalysis />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Analytics />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/client-portal" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <ClientPortal />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/testing" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Testing />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Settings />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Users />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/security" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <Security />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/workflow-automation" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <WorkflowAutomation />
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/documents" element={
              <ProtectedRoute>
                <EnhancedResponsiveLayout>
                  <div className="container mx-auto p-6">
                    <DocumentManagementDashboard />
                  </div>
                </EnhancedResponsiveLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
