import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabase';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionSet, setSessionSet] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  const userType = searchParams.get('type') || 'influencer';
  
  // Handle different token formats from Supabase
  const token = searchParams.get('access_token') || searchParams.get('token') || searchParams.get('token_hash');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    // Comprehensive debugging
    const debugData = {
      currentURL: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      urlParams: Object.fromEntries(searchParams.entries()),
      token: token ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      userType,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 ResetPassword Debug Info:', debugData);
    setDebugInfo(JSON.stringify(debugData, null, 2));

    // Set the session from URL parameters if tokens are present
    const setSession = async () => {
      if (!token) {
        console.log('❌ No token found in URL parameters');
        setError('Invalid reset link. No authentication token found. Please request a new password reset.');
        return;
      }

      try {
        console.log('🔐 Attempting to set session with token...');
        
        // Method 1: Try with access_token and refresh_token (OAuth flow)
        if (refreshToken) {
          console.log('📝 Using access_token + refresh_token method');
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('❌ Session error (method 1):', error);
            throw error;
          }
          
          if (data?.session) {
            console.log('✅ Session set successfully (method 1)', {
              userId: data.session.user?.id,
              email: data.session.user?.email,
              expiresAt: data.session.expires_at
            });
          }
          setSessionSet(true);
          return;
        }
        
        // Method 2: Try verifying as recovery token (password reset flow)
        console.log('🔑 Using recovery token verification method');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        if (error) {
          console.error('❌ Recovery token error (method 2):', error);
          
          // Method 3: Try as email confirmation token
          console.log('📧 Trying as email confirmation token');
          const { data: emailData, error: emailError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });
          
          if (emailError) {
            console.error('❌ Email token error (method 3):', emailError);
            throw emailError;
          }
          
          if (emailData?.session) {
            console.log('✅ Email token verified successfully (method 3)', {
              userId: emailData.session.user?.id,
              email: emailData.session.user?.email,
              userConfirmedAt: emailData.session.user?.email_confirmed_at
            });
          }
          setSessionSet(true);
          return;
        }
        
        if (data?.session) {
          console.log('✅ Recovery token verified successfully (method 2)', {
            userId: data.session.user?.id,
            email: data.session.user?.email,
            userType: data.session.user?.user_metadata?.userType
          });
        }
        setSessionSet(true);
        
      } catch (err: any) {
        console.error('💥 Session setup error:', err);
        if (err.message?.includes('expired')) {
          setError('This reset link has expired. Please request a new password reset.');
        } else if (err.message?.includes('invalid')) {
          setError('Invalid reset link. Please request a new password reset.');
        } else {
          setError('Failed to authenticate reset request. Please try again or request a new reset link.');
        }
      }
    };

    setSession();
  }, [token, refreshToken, searchParams]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUppercase || !hasNumber) {
      setError('Password must contain at least one uppercase letter and one number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        console.log('✅ Password updated successfully', {
          userId: data.user.id,
          email: data.user.email,
          lastSignIn: data.user.last_sign_in_at,
          updatedAt: data.user.updated_at
        });
      } else {
        console.log('✅ Password updated successfully (no user data returned)');
      }
      
      // ✅ FIXED: Sign out user after password reset to prevent auto-login
      console.log('🚪 Signing out user after password reset...');
      await supabase.auth.signOut();
      
      setSuccess(true);

    } catch (error: any) {
      console.error('💥 Password update error:', error);
      
      if (error.message?.includes('session')) {
        setError('Session expired. Please request a new password reset link.');
      } else if (error.message?.includes('same password')) {
        setError('New password must be different from your current password.');
      } else {
        setError(error.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Success screen now prompts to login instead of auto-redirecting
  if (success) {
    return (
      <div className="reset-success">
        <div className="success-container">
          <div className="checkmark">✅</div>
          <h2>Password Updated Successfully!</h2>
          <p>Your password has been updated. You can now login with your new password.</p>
          
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/auth')} 
              className="login-button"
            >
              Go to Login
            </button>
          </div>
          
          <p className="help-text">
            Please use your email and new password to sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-container">
        <div className="header">
          <img 
            src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
            alt="InfluencerFlow Logo" 
            className="logo"
          />
          <h1>Reset Your Password</h1>
          <p>Enter your new password for your {userType} account</p>
        </div>

        {/* Debug Section - Remove this in production */}
        <details style={{marginBottom: '1rem', fontSize: '0.8rem'}}>
          <summary style={{cursor: 'pointer', color: '#666'}}>🔍 Debug Info (click to expand)</summary>
          <pre style={{background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.7rem'}}>
            {debugInfo}
          </pre>
        </details>

        {!sessionSet && !error && (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Verifying reset link...</p>
          </div>
        )}

        {sessionSet && (
          <form onSubmit={handlePasswordUpdate} className="reset-form">
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <small>Must be at least 8 characters with uppercase and number</small>
            </div>

            <div className="form-group">
              <label>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="update-button"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        {error && (
          <div className="error-message">
            {error}
            <div className="error-actions">
              <button onClick={() => navigate('/auth')} className="link-button">
                Back to Login
              </button>
              <button onClick={() => navigate('/auth')} className="link-button">
                Request New Reset Link
              </button>
            </div>
          </div>
        )}

        <div className="back-link">
          <button onClick={() => navigate('/auth')} className="link-button">
            Back to Login
          </button>
        </div>
      </div>

      <style>{`
        .reset-password-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .reset-container {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo {
          width: 48px;
          height: 48px;
          margin-bottom: 1rem;
        }

        .header h1 {
          margin: 0 0 0.5rem 0;
          color: #1a202c;
          font-size: 1.8rem;
        }

        .header p {
          margin: 0;
          color: #718096;
          font-size: 0.9rem;
        }

        .loading-message {
          text-align: center;
          margin: 2rem 0;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .reset-form {
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #6b7280;
          font-size: 0.8rem;
        }

        .update-button {
          width: 100%;
          padding: 0.875rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .update-button:hover {
          background: #2563eb;
        }

        .update-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.875rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .error-actions {
          margin-top: 1rem;
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .back-link {
          text-align: center;
        }

        .link-button {
          background: none;
          border: none;
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .link-button:hover {
          color: #2563eb;
        }

        .reset-success {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .success-container {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          width: 100%;
          text-align: center;
        }

        .checkmark {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .success-container h2 {
          color: #059669;
          margin-bottom: 1rem;
        }

        .success-container p {
          color: #374151;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .action-buttons {
          margin: 2rem 0;
        }

        .login-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .login-button:hover {
          background: #2563eb;
        }

        .help-text {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;