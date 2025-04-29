import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, type UserProfile } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    let retries = 2; // Number of retry attempts
    const delay = 1000; // Delay between retries in milliseconds

    while (retries >= 0) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select(`
            *,
            role:user_roles(*),
            classification:user_classifications(*)
          `)
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data && retries > 0) {
          // Profile doesn't exist yet, wait and retry
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          continue;
        }

        setProfile(data);
        break; // Success, exit the retry loop
      } catch (error) {
        if (retries === 0) {
          console.error('Error fetching user profile:', error);
          // On final retry, set profile to null to indicate the error state
          setProfile(null);
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
        }
      }
    }

    setLoading(false);
  }

  return { user, profile, loading };
}