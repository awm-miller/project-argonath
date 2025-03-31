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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // If this is a new signup, create the user profile
        if (event === 'SIGNED_IN') {
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();

          if (!existingProfile) {
            // Get the default role and classification
            const [{ data: roles }, { data: classifications }] = await Promise.all([
              supabase.from('user_roles').select('id').eq('name', 'user').single(),
              supabase.from('user_classifications').select('id').eq('name', 'green').single()
            ]);

            // Create new user profile
            await supabase.from('user_profiles').insert({
              id: session.user.id,
              role_id: roles?.id,
              classification_id: classifications?.id,
              full_name: session.user.email?.split('@')[0] || 'New User'
            });
          }
        }
        fetchProfile(session.user.id);
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
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }

  return { user, profile, loading };
}