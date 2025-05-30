import { useEffect, useState } from 'react';
import supabase from '../utils/supabase';

function Auth() {
  const [message, setMessage] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        setMessage('Error signing out. Please try again.');
      } else {
        setMessage('You have been signed out successfully.');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      setMessage('Unexpected error occurred. Please try again.');
    }
  };

  const getProtectedData = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMessage('You are not logged in. Please log in to access protected data.');
      setIsLoggedIn(false);
      return;
    }
    console.clear();
    console.log('Protected data fetched successfully.');
    console.log('Session:', data.session.user.user_metadata);
    setMessage('You are logged in!');
    setIsLoggedIn(true);
  };

  useEffect(() => {
    getProtectedData();
  }, []);

  return (
    <div>
      <h2>Supabase OAuth + Express Protected Route</h2>
      <div className="flex gap-4">
        <button 
          onClick={handleLogin} 
          className='bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors'
          disabled={isLoggedIn}
        >
          Login with Google
        </button>
        {isLoggedIn && (
          <button 
            onClick={handleSignOut} 
            className='bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors'
          >
            Sign Out
          </button>
        )}
      </div>
      <pre className="mt-4">{message}</pre>
    </div>
  );
}

export default Auth;