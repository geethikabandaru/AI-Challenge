import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm onAuth={() => {}} />;
  }

  return <Dashboard onLogout={() => setSession(null)} />;
}

export default App;
