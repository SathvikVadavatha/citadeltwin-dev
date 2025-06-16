
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './providers/AuthProvider';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Index from './pages/Index';
import { Dashboard } from './pages/Dashboard';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { UploadBlueprint } from './pages/UploadBlueprint';
import { ViewBlueprints } from './pages/ViewBlueprints';
import Collaboration from './pages/Collaboration';
import { Compliance } from './pages/Compliance';
import { FEAAnalysis } from './pages/FEAAnalysis';
import { Analytics } from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import { ValidationDashboard } from './pages/ValidationDashboard';
import { ClientPortal } from './pages/ClientPortal';
import { Settings } from './pages/Settings';
import { Users } from './pages/Users';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/*" element={<AuthLayout />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage onNavigate={() => {}} /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadBlueprint /></ProtectedRoute>} />
            <Route path="/blueprints" element={<ProtectedRoute><ViewBlueprints /></ProtectedRoute>} />
            <Route path="/collaboration" element={<ProtectedRoute><Collaboration /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/fea-analysis" element={<ProtectedRoute><FEAAnalysis /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            <Route path="/validation" element={<ProtectedRoute><ValidationDashboard /></ProtectedRoute>} />
            <Route path="/client-portal" element={<ClientPortal />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
