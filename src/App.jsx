import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { LoadingScreen } from './components/ui/LoadingSpinner';
import { DEV_MODE } from './lib/config';

// Layouts
import AppShell from './components/layout/AppShell';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import AuthCallback from './pages/auth/AuthCallback';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// App pages
import DecksPage from './pages/DecksPage';
import SearchPage from './pages/SearchPage';
import AddWordPage from './pages/AddWordPage';
import ImportPage from './pages/ImportPage';
import DeckDetailPage from './pages/DeckDetailPage';
import CommunityPage from './pages/CommunityPage';
import SettingsPage from './pages/settings/SettingsPage';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Bypass auth in dev mode
  if (DEV_MODE) {
    return children;
  }

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public route wrapper (redirect if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      } />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* App routes with AppShell layout */}
      <Route path="/" element={<AppShell />}>
        {/* Public routes (no auth required) */}
        <Route index element={<SearchPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="community" element={<CommunityPage />} />

        {/* Protected routes */}
        <Route path="decks" element={
          <ProtectedRoute>
            <DecksPage />
          </ProtectedRoute>
        } />
        <Route path="decks/:deckId" element={
          <ProtectedRoute>
            <DeckDetailPage />
          </ProtectedRoute>
        } />
        <Route path="add" element={
          <ProtectedRoute>
            <AddWordPage />
          </ProtectedRoute>
        } />
        <Route path="import" element={
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all - redirect to home/search */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
