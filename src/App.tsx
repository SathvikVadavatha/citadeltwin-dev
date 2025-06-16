
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <EnhancedResponsiveLayout>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/blueprints/upload" element={<ProtectedRoute><UploadBlueprint /></ProtectedRoute>} />
              <Route path="/blueprints/view" element={<ProtectedRoute><ViewBlueprints /></ProtectedRoute>} />
              <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
              <Route path="/fea-analysis" element={<ProtectedRoute><FEAAnalysis /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
              <Route path="/testing" element={<ProtectedRoute><Testing /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
              <Route path="/workflow-automation" element={<ProtectedRoute><WorkflowAutomation /></ProtectedRoute>} />
              <Route 
                path="/documents" 
                element={
                  <ProtectedRoute>
                    <div className="container mx-auto p-6">
                      <DocumentManagementDashboard />
                    </div>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </EnhancedResponsiveLayout>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
