import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ResponsiveLayout from '@/layouts/ResponsiveLayout';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetails from '@/pages/ProjectDetails';
import AIAssistant from '@/pages/AIAssistant';
import CADInterface from '@/pages/CADInterface';
import BIMViewer from '@/pages/BIMViewer';
import FEAAnalysis from '@/pages/FEAAnalysis';
import CostEstimator from '@/pages/CostEstimator';
import AccountSettings from '@/pages/AccountSettings';
import Pricing from '@/pages/Pricing';
import Support from '@/pages/Support';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';
import Integrations from '@/pages/Integrations';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Dashboard />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Projects />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/projects/:projectId" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <ProjectDetails />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <AIAssistant />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cad" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <CADInterface />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bim-viewer" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <BIMViewer />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fea-analysis" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <FEAAnalysis />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cost-estimator" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <CostEstimator />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account-settings" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <AccountSettings />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/support" element={<Support />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
            <Route 
              path="/integrations" 
              element={
                <ProtectedRoute>
                  <ResponsiveLayout>
                    <Integrations />
                  </ResponsiveLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
