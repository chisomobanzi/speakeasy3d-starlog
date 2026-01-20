import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { LoadingScreen } from '../ui/LoadingSpinner';

export default function AppShell() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header - visible on all screens */}
      <Header />

      {/* Main content area */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom navigation - mobile only */}
      <BottomNav className="md:hidden" />
    </div>
  );
}
