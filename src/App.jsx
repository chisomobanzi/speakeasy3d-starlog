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

      {/* Public browsing routes (no auth required) */}
      <Route path="/dictionary" element={<AppShell />}>
        <Route index element={<SearchPage />} />
      </Route>
      <Route path="/browse" element={<AppShell />}>
        <Route index element={<CommunityPage />} />
      </Route>

      {/* Protected app routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        {/* Home - Decks page */}
        <Route index element={<DecksPage />} />

        {/* Search */}
        <Route path="search" element={<SearchPage />} />

        {/* Add word */}
        <Route path="add" element={<AddWordPage />} />

        {/* Import deck */}
        <Route path="import" element={<ImportPage />} />

        {/* Deck detail */}
        <Route path="decks/:deckId" element={<DeckDetailPage />} />

        {/* Community */}
        <Route path="community" element={<CommunityPage />} />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all - redirect to dictionary for public access */}
      <Route path="*" element={<Navigate to="/dictionary" replace />} />
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
