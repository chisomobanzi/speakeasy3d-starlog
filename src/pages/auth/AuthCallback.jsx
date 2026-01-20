import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingScreen } from '../../components/ui/LoadingSpinner';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (session) {
          // Check if this is a new user (no profile yet)
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            // Create profile for new OAuth user
            await supabase.from('profiles').insert({
              id: session.user.id,
              display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              avatar_url: session.user.user_metadata?.avatar_url,
            });
          }

          // Redirect to dashboard or intended destination
          const returnTo = new URLSearchParams(window.location.search).get('returnTo');
          navigate(returnTo || '/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return <LoadingScreen message="Completing sign in..." />;
}
