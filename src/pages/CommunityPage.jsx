import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import CommunityTab from '../components/starlog/CommunityTab';

export default function CommunityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-28">
      <CommunityTab />

      {/* Floating Capture button — mobile */}
      <Link
        to="/add"
        className="md:hidden fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-starlog-400 to-starlog-600 flex items-center justify-center shadow-lg shadow-starlog-500/30 active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-white" />
      </Link>
    </div>
  );
}
