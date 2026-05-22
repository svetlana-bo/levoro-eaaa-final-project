import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { posthog } from "@/lib/posthog";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);

        if (session?.user) {
          posthog.identify(session.user.id, {
            email: session.user.email,
          });

          // On sign-in, sync profile data from OAuth providers (e.g. Google)
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              const meta = session.user.user_metadata;
              const fullName = meta?.full_name || meta?.name || '';
              const avatarUrl = meta?.avatar_url || meta?.picture;
              const firstName = meta?.first_name || fullName.split(' ')[0] || null;
              const lastName = meta?.last_name || fullName.split(' ').slice(1).join(' ') || null;

              if (firstName || avatarUrl) {
                await supabase.from('profiles').update({
                  first_name: firstName,
                  last_name: lastName,
                  avatar_url: avatarUrl,
                  last_login: new Date().toISOString(),
                }).eq('id', session.user.id);
              }
            }, 0);

          // Detect invite flow and redirect to set password
            const hash = window.location.hash;
            const path = window.location.pathname;
            if (hash.includes('type=invite') || hash.includes('type=magiclink')) {
              if (path !== '/reset-password') {
                navigate('/reset-password');
              }
            } else if (path !== '/reset-password') {
              // Redirect from public pages to dashboard
              if (path === '/' || path === '/login' || path === '/signup') {
                navigate('/dashboard');
              }
            }
          }
        } else {
          posthog.reset();
        }
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
