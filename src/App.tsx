
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './providers/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ResponsiveLayout } from './components/layout/ResponsiveLayout';
import { Dashboard } from './pages/Dashboard';
import { UploadBlueprint } from './pages/UploadBlueprint';
import { ViewBlueprints } from './pages/ViewBlueprints';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import { Compliance } from './pages/Compliance';
import { FEAAnalysis } from './pages/FEAAnalysis';
import { Analytics } from './pages/Analytics';
import { DocumentManagementDashboard } from '@/components/documents/DocumentManagementDashboard';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ResponsiveLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/blueprints/upload" element={<ProtectedRoute><UploadBlueprint /></ProtectedRoute>} />
              <Route path="/blueprints/view" element={<ProtectedRoute><ViewBlueprints /></ProtectedRoute>} />
              <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
              <Route path="/fea-analysis" element={<ProtectedRoute><FEAAnalysis /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
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
          </ResponsiveLayout>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
