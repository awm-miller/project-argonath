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

      // Handle case where profile doesn't exist yet
      if (!data) {
        // Wait a bit and try again, in case the trigger is still creating the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: retryData, error: retryError } = await supabase
          .from('user_profiles')
          .select(`
            *,
            role:user_roles(*),
            classification:user_classifications(*)
          `)
          .eq('id', userId)
          .maybeSingle();

        if (retryError) throw retryError;
        setProfile(retryData);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  return { user, profile, loading };
}