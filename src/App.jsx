import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { LoadingScreen } from './components/ui/LoadingSpinner';

// DEV MODE: Set to true to bypass authentication
const DEV_MODE = true;

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

      {/* Public routes (no auth required) */}
      <Route path="/" element={<AppShell />}>
        {/* Home - Search/Dictionary (public) */}
        <Route index element={<SearchPage />} />
        <Route path="search" element={<SearchPage />} />

        {/* Community browsing (public) */}
        <Route path="community" element={<CommunityPage />} />
      </Route>

      {/* Protected app routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        {/* Decks (protected) */}
        <Route path="decks" element={<DecksPage />} />

        {/* Add word */}
        <Route path="add" element={<AddWordPage />} />

        {/* Import deck */}
        <Route path="import" element={<ImportPage />} />

        {/* Deck detail */}
        <Route path="decks/:deckId" element={<DeckDetailPage />} />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
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
