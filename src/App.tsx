import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LoginScreen from './components/auth/LoginScreen';
import ClientDashboard from './components/dashboard/ClientDashboard';
import InstructorDashboard from './components/dashboard/InstructorDashboard';

const AppContent: React.FC = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !userRole) {
    return <LoginScreen />;
  }

  if (userRole === 'client_support') {
    return <ClientDashboard />;
  }

  return <InstructorDashboard />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;