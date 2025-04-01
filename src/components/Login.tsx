import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Argonath</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                }
              }
            },
            style: {
              button: {
                borderRadius: '6px',
                height: '40px'
              },
              container: {
                gap: '16px'
              }
            }
          }}
          providers={[]}
          view="sign_in"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
}

export default Login;