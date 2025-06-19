import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertCircle, Users, Building2, Mail } from "lucide-react";
import supabase from '../../utils/supabase';

interface LoginForm {
  email: string;
  invitationCode: string;
  password: string;
  confirmPassword: string;
  // Influencer signup fields
  username: string;
  followers: string;
  platforms: string;
  bio: string;
  phoneNum: string;
  // Email verification
  verificationCode: string;
}

type UserType = 'brand' | 'influencer';
type LoginMode = 'invitation' | 'existing-user' | 'influencer-signup' | 'forgot-password';
type LoginStep = 'choose-mode' | 'invitation-entry' | 'password-setup' | 'email-login' | 'influencer-signup' | 'email-verification' | 'forgot-password' | 'complete';

interface UserInfo {
  email: string;
  name?: string;
  brand?: string;
  username?: string;
  userType?: UserType;
  requiresPasswordSetup?: boolean;
  invitationVerified?: boolean;
  accountActivated?: boolean;
  emailVerificationRequired?: boolean;
  emailVerified?: boolean;
}

export function UserLogin() {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    invitationCode: '',
    password: '',
    confirmPassword: '',
    username: '',
    followers: '',
    platforms: '',
    bio: '',
    phoneNum: '',
    verificationCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [userType, setUserType] = useState<UserType>('brand');
  const [loginMode, setLoginMode] = useState<LoginMode>('invitation');
  const [step, setStep] = useState<LoginStep>('choose-mode');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Password reset specific states
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle URL parameters and routes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const signupParam = urlParams.get('signup');
    const signinParam = urlParams.get('signin');
    
    // Set user type from tab parameter
    if (tabParam === 'brand' || tabParam === 'influencer') {
      setUserType(tabParam);
    }
    
    // Handle specific flows based on URL parameters
    // Check if parameters exist and have valid values (not empty strings)
    if (signupParam !== null) {
      // Handle signup flow
      if (tabParam === 'brand') {
        // For brands, signup means invitation code entry
        setStep('invitation-entry');
        setLoginMode('invitation');
      } else if (tabParam === 'influencer') {
        // For influencers, signup means direct signup form
        setStep('influencer-signup');
        setLoginMode('influencer-signup');
      }
    } else if (signinParam !== null) {
      // Handle signin flow - direct to email login for both types
      setStep('email-login');
      setLoginMode('existing-user');
    }
    // If neither signup nor signin, default to choose-mode
  }, []);

  // Update URL when user type changes
  const handleUserTypeChange = (newUserType: UserType) => {
    setUserType(newUserType);
    const url = new URL(window.location.href);
    
    // Reset to clean URL with just the tab parameter when manually switching tabs
    url.search = `?tab=${newUserType}`;
    window.history.replaceState({}, '', url.toString());
    
    // Reset form and go to choose-mode when manually switching tabs
    setForm({
      email: '',
      invitationCode: '',
      password: '',
      confirmPassword: '',
      username: '',
      followers: '',
      platforms: '',
      bio: '',
      phoneNum: '',
      verificationCode: ''
    });
    setError(null);
    setSuccess(null);
    setResetSuccess(false);
    
    // Always go to choose-mode when manually switching tabs
    setStep('choose-mode');
  };

  // Clear messages when switching modes or steps
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [loginMode, step]);

  const handleInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify-invitation',
          email: form.email.trim().toLowerCase(),
          code: form.invitationCode.trim().toUpperCase(),
          userType
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUserInfo(result.user);
        setStep('password-setup');
        setSuccess(`Welcome ${result.user.name}! Please create your secure password.`);
      } else {
        setError(result.error || 'Invalid invitation code. Please check your email for the correct code.');
      }
    } catch (err) {
      setError('Failed to verify invitation. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const validation = getPasswordStrength();
    const requiredMissing = validation.missing.filter(item => !item.includes('optional'));
    
    if (requiredMissing.length > 0) {
      setError(`Password requirements not met. Missing: ${requiredMissing.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'setup-password',
          email: form.email.trim().toLowerCase(),
          password: form.password,
          userType
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUserInfo(result.user);
        setStep('complete');
        setSuccess('Account activated successfully! Redirecting to your dashboard...');
        
        if (result.user?.accessToken) {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: result.user.accessToken,
            refresh_token: result.user.refreshToken,
            user: result.user
          }));
          // Set Supabase session for global auth state
          await supabase.auth.setSession({
            access_token: result.user.accessToken,
            refresh_token: result.user.refreshToken,
          });
        }
        
        setTimeout(() => {
          // Route to appropriate dashboard based on user type
          const dashboardUrl = userType === 'brand' 
            ? '/dashboard'                    // Brand dashboard
            : '/creator/dashboard';           // Creator dashboard
          
          // Since we're on same domain, use relative URLs
          window.location.href = dashboardUrl;
        }, 2000);
      } else {
        setError(result.error || 'Failed to set up password. Please try again.');
      }
    } catch (err) {
      setError('Failed to set up password. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'email-login',
          email: form.email.trim().toLowerCase(),
          password: form.password,
          userType
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Login successful! Redirecting to your dashboard...');
        
        if (result.user?.accessToken) {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: result.user.accessToken,
            refresh_token: result.user.refreshToken,
            user: result.user
          }));
          // Set Supabase session for global auth state
          await supabase.auth.setSession({
            access_token: result.user.accessToken,
            refresh_token: result.user.refreshToken,
          });
        }
        
        setTimeout(() => {
          // Route to appropriate dashboard based on user type
          const dashboardUrl = userType === 'brand' 
            ? '/dashboard'                    // Brand dashboard
            : '/creator/dashboard';           // Creator dashboard
          
          // Since we're on same domain, use relative URLs
          window.location.href = dashboardUrl;
        }, 1500);
      } else {
        setError(result.error || 'Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      setError('Failed to login. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInfluencerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const validation = getPasswordStrength();
    const requiredMissing = validation.missing.filter(item => !item.includes('optional'));
    
    if (requiredMissing.length > 0) {
      setError(`Password requirements not met. Missing: ${requiredMissing.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'influencer-signup',
          email: form.email.trim().toLowerCase(),
          password: form.password,
          username: form.username.trim(),
          bio: form.bio.trim(),
          phoneNum: form.phoneNum.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUserInfo(result.user);
        
        if (result.user?.emailVerificationRequired) {
          setStep('email-verification');
          setSuccess('Account created! Please check your email for a verification code.');
        } else {
          setStep('complete');
          setSuccess('Account created successfully! Redirecting to your dashboard...');
          
          if (result.user?.accessToken) {
            localStorage.setItem('supabase.auth.token', JSON.stringify({
              access_token: result.user.accessToken,
              refresh_token: result.user.refreshToken,
              user: result.user
            }));
            // Set Supabase session for global auth state
            await supabase.auth.setSession({
              access_token: result.user.accessToken,
              refresh_token: result.user.refreshToken,
            });
          }
          
          setTimeout(() => {
            // Route to creator dashboard
            window.location.href = '/creator/dashboard';
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('Failed to create account. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify-email',
          email: form.email.trim().toLowerCase(),
          code: form.verificationCode.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUserInfo(result.user);
        setStep('complete');
        setSuccess('Email verified successfully! Your account is now active.');
      } else {
        setError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to verify email. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resend-verification',
          email: form.email.trim().toLowerCase()
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('New verification code sent! Please check your email.');
        // Clear the verification code field
        setForm(prev => ({ ...prev, verificationCode: '' }));
      } else {
        setError(result.error || 'Failed to resend verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to resend verification code. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Password reset functionality
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: form.email.trim().toLowerCase(),
          userType
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResetSuccess(true);
        setSuccess('Password reset email sent! Check your inbox for instructions.');
        setError(null);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('Failed to send reset email. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = () => {
    window.location.href = '/early-access';
  };

  const resetToStart = () => {
    setStep('choose-mode');
    setForm({
      email: '',
      invitationCode: '',
      password: '',
      confirmPassword: '',
      username: '',
      followers: '',
      platforms: '',
      bio: '',
      phoneNum: '',
      verificationCode: ''
    });
    setUserInfo(null);
    setError(null);
    setSuccess(null);
    setResetSuccess(false);
  };

  const getPasswordStrength = () => {
    if (!form.password) return { score: 0, text: '', color: '', missing: [] };
    
    let score = 0;
    let missing = [];
    
    if (form.password.length >= 8) {
      score++;
    } else {
      missing.push('At least 8 characters');
    }
    
    if (/[A-Z]/.test(form.password)) {
      score++;
    } else {
      missing.push('One uppercase letter');
    }
    
    if (/[a-z]/.test(form.password)) {
      score++;
    } else {
      missing.push('One lowercase letter');
    }
    
    if (/[0-9]/.test(form.password)) {
      score++;
    } else {
      missing.push('One number');
    }
    
    if (/[^A-Za-z0-9]/.test(form.password)) {
      score++;
    } else {
      missing.push('One special character (optional)');
    }
    
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      score,
      text: texts[Math.min(score, 4)],
      color: colors[Math.min(score, 4)],
      missing: missing
    };
  };

  const getPasswordValidationMessage = () => {
    if (!form.password) return null;
    
    const validation = getPasswordStrength();
    const requiredMissing = validation.missing.filter(item => !item.includes('optional'));
    
    if (requiredMissing.length > 0) {
      return `Missing: ${requiredMissing.join(', ')}`;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="max-w-md w-full mx-4">
        
        <div className="bg-white dark:bg-slate-900 p-8">
          
          {/* Header with User Type Tabs */}
          <div className="mb-8">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 mr-3">
                <img 
                  src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
                  alt="InfluencerFlow Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                InfluencerFlow.in
              </span>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => handleUserTypeChange('brand')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  userType === 'brand'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Brands
              </button>
              <button
                onClick={() => handleUserTypeChange('influencer')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  userType === 'influencer'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Creators
              </button>
            </div>
            
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
              {step === 'choose-mode' && `${userType === 'brand' ? 'Brand' : 'Creator'} Access`}
              {step === 'invitation-entry' && 'Brand Invitation'}
              {step === 'password-setup' && 'Setup Account'}
              {step === 'email-login' && `${userType === 'brand' ? 'Brand' : 'Creator'} Sign In`}
              {step === 'influencer-signup' && 'Join as Creator'}
              {step === 'email-verification' && 'Verify Your Email'}
              {step === 'forgot-password' && 'Reset Password'}
              {step === 'complete' && 'Access Granted'}
            </h1>
            
            <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
              {step === 'choose-mode' && `// Choose your authentication method`}
              {step === 'invitation-entry' && '// Enter your 6-digit invitation code'}
              {step === 'password-setup' && '// Create secure credentials'}
              {step === 'email-login' && '// Login with existing credentials'}
              {step === 'influencer-signup' && '// Create your creator account'}
              {step === 'email-verification' && '// Enter the 6-digit code from your email'}
              {step === 'forgot-password' && '// Enter your email to reset password'}
              {step === 'complete' && '// Redirecting to dashboard...'}
            </p>
          </div>

          {/* Back button */}
          {step !== 'choose-mode' && step !== 'complete' && (
            <HoverBorderGradient
              containerClassName="rounded-lg mb-6"
              as="button"
              className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center px-4 py-2 text-sm font-mono transition-colors"
              onClick={() => {
                if (step === 'invitation-entry' || step === 'email-login' || step === 'influencer-signup') {
                  setStep('choose-mode');
                  setLoginMode('invitation');
                } else if (step === 'password-setup') {
                  setStep('invitation-entry');
                } else if (step === 'email-verification') {
                  setStep('influencer-signup');
                } else if (step === 'forgot-password') {
                  setStep('email-login');
                }
                setError(null);
                setSuccess(null);
                setResetSuccess(false);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>back()</span>
            </HoverBorderGradient>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Choose Login Mode */}
          {step === 'choose-mode' && (
            <div className="space-y-4">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                authentication_method() {"{"}
              </div>
              
              {userType === 'brand' ? (
                <>
                  <HoverBorderGradient
                    containerClassName="rounded-xl w-full"
                    as="button"
                    className="w-full p-4 text-left bg-white dark:bg-slate-900 flex items-center transition-colors group"
                    onClick={() => {
                      setLoginMode('invitation');
                      setStep('invitation-entry');
                    }}
                  >
                    <div className="w-2 h-2 bg-slate-900 dark:bg-slate-100 rounded-full mr-4 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                        I have an invitation code
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        // First time brand account setup
                      </div>
                    </div>
                  </HoverBorderGradient>
                  
                  <HoverBorderGradient
                    containerClassName="rounded-xl w-full"
                    as="button"
                    className="w-full p-4 text-left bg-white dark:bg-slate-900 flex items-center transition-colors group"
                    onClick={() => {
                      setLoginMode('existing-user');
                      setStep('email-login');
                    }}
                  >
                    <div className="w-2 h-2 bg-slate-900 dark:bg-slate-100 rounded-full mr-4 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                        I already have a brand account
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        // Email and password login
                      </div>
                    </div>
                  </HoverBorderGradient>
                </>
              ) : (
                <>
                  <HoverBorderGradient
                    containerClassName="rounded-xl w-full"
                    as="button"
                    className="w-full p-4 text-left bg-white dark:bg-slate-900 flex items-center transition-colors group"
                    onClick={() => {
                      setLoginMode('influencer-signup');
                      setStep('influencer-signup');
                    }}
                  >
                    <div className="w-2 h-2 bg-slate-900 dark:bg-slate-100 rounded-full mr-4 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                        Create influencer account
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        // Join as content creator
                      </div>
                    </div>
                  </HoverBorderGradient>
                  
                  <HoverBorderGradient
                    containerClassName="rounded-xl w-full"
                    as="button"
                    className="w-full p-4 text-left bg-white dark:bg-slate-900 flex items-center transition-colors group"
                    onClick={() => {
                      setLoginMode('existing-user');
                      setStep('email-login');
                    }}
                  >
                    <div className="w-2 h-2 bg-slate-900 dark:bg-slate-100 rounded-full mr-4 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                        I already have an influencer account
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                        // Email and password login
                      </div>
                    </div>
                  </HoverBorderGradient>
                </>
              )}

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-4">
                {"}"}
              </div>

              {userType === 'brand' && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Don't have access yet?{' '}
                    <button
                      onClick={handleRequestAccess}
                      className="font-mono font-medium text-slate-900 dark:text-slate-100 underline hover:no-underline"
                    >
                      request_access()
                    </button>
                  </p>
                  <div className="mt-4 text-xs text-slate-500 dark:text-slate-600 font-mono">
                    <p>// Quick links:</p>
                    <p>• /auth?tab=brand&signup → invitation code</p>
                    <p>• /auth?tab=brand&signin → direct login</p>
                  </div>
                </div>
              )}

              {userType === 'influencer' && (
                <div className="mt-8 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-600 font-mono">
                    <p>// Quick links:</p>
                    <p>• /auth?tab=influencer&signup → create account</p>
                    <p>• /auth?tab=influencer&signin → direct login</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invitation Code Entry - Only for brands */}
          {step === 'invitation-entry' && (
            <div className="space-y-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                verify_invitation() {"{"}
              </div>
              
              <div className="space-y-4 pl-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 font-mono"
                    placeholder="your.email@company.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="invitationCode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Invitation Code
                  </Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    value={form.invitationCode}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      invitationCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') 
                    }))}
                    className="mt-1 font-mono text-center text-xl tracking-[0.3em] font-bold"
                    placeholder="ABC123"
                    maxLength={6}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500 font-mono">
                    // 6-character code from your email
                  </p>
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {"}"}
              </div>

              <HoverBorderGradient
                containerClassName="rounded-xl w-full"
                as="button"
                className={`w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium ${
                  loading || !form.email || form.invitationCode.length !== 6 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                onClick={loading || !form.email || form.invitationCode.length !== 6 ? undefined : handleInvitationSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    verifying...
                  </>
                ) : (
                  'verify_code()'
                )}
              </HoverBorderGradient>
            </div>
          )}

          {/* Email/Password Login */}
          {step === 'email-login' && (
            <div className="space-y-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                authenticate() {"{"}
              </div>
              
              <div className="space-y-4 pl-4">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 font-mono"
                    placeholder={userType === 'brand' ? 'your.email@company.com' : 'you@email.com'}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-10 font-mono"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {"}"}
              </div>

              <HoverBorderGradient
                containerClassName="rounded-xl w-full"
                as="button"
                className={`w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium ${
                  loading || !form.email || !form.password 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                onClick={loading || !form.email || !form.password ? undefined : handleEmailPasswordLogin}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    signing_in...
                  </>
                ) : (
                  'login()'
                )}
              </HoverBorderGradient>

              {/* Forgot Password Link */}
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('forgot-password');
                    setLoginMode('forgot-password');
                    setResetSuccess(false);
                  }}
                  className="font-mono text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline hover:no-underline"
                >
                  forgot_password()
                </button>
                
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {userType === 'brand' ? 'First time here?' : 'New influencer?'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (userType === 'brand') {
                        setLoginMode('invitation');
                        setStep('invitation-entry');
                      } else {
                        setLoginMode('influencer-signup');
                        setStep('influencer-signup');
                      }
                    }}
                    className="font-mono font-medium text-slate-900 dark:text-slate-100 underline hover:no-underline"
                  >
                    {userType === 'brand' ? 'use_invitation()' : 'create_account()'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* NEW: Forgot Password Step */}
          {step === 'forgot-password' && (
            <div className="space-y-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                reset_password() {"{"}
              </div>

              {resetSuccess ? (
                <div className="space-y-4 pl-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Reset Email Sent!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      We've sent password reset instructions to <strong>{form.email}</strong>
                    </p>
                    <div className="text-xs text-slate-500 dark:text-slate-600 font-mono space-y-1">
                      <p>• Check your email inbox</p>
                      <p>• Look for an email from Supabase</p>
                      <p>• Click the reset link in the email</p>
                      <p>• Link expires in 1 hour</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pl-4">
                  <div>
                    <Label htmlFor="reset-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 font-mono"
                      placeholder={userType === 'brand' ? 'your.email@company.com' : 'you@email.com'}
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500 font-mono">
                      // Enter the email for your {userType} account
                    </p>
                  </div>
                </div>
              )}

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {"}"}
              </div>

              {!resetSuccess && (
                <HoverBorderGradient
                  containerClassName="rounded-xl w-full"
                  as="button"
                  className={`w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium ${
                    loading || !form.email.trim()
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                  onClick={loading || !form.email.trim() ? undefined : handlePasswordReset}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      sending_reset_email...
                    </>
                  ) : (
                    'send_reset_email()'
                  )}
                </HoverBorderGradient>
              )}

              {resetSuccess && (
                <HoverBorderGradient
                  containerClassName="rounded-xl w-full"
                  as="button"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono flex items-center justify-center px-6 py-3 text-base font-medium border border-slate-200 dark:border-slate-700"
                  onClick={() => {
                    setStep('email-login');
                    setLoginMode('existing-user');
                    setResetSuccess(false);
                  }}
                >
                  back_to_login()
                </HoverBorderGradient>
              )}

              {/* Help section */}
              <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 mt-6">
                <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-2">
                  // Need help?
                </p>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                  <div>• Check spam/junk folder</div>
                  <div>• Reset link expires in 1 hour</div>
                  <div>• Only works for existing accounts</div>
                  <div>• Contact support@influencerflow.in</div>
                </div>
              </div>
            </div>
          )}

          {/* Influencer Signup */}
          {step === 'influencer-signup' && (
            <div className="space-y-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                create_influencer_account() {"{"}
              </div>
              
              <div className="space-y-4 pl-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 font-mono"
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1 font-mono"
                      placeholder="@yourhandle"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bio
                  </Label>
                  <Input
                    id="bio"
                    type="text"
                    value={form.bio}
                    onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-1 font-mono"
                    placeholder="Content creator specializing in..."
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNum" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phoneNum"
                    type="tel"
                    value={form.phoneNum}
                    onChange={(e) => setForm(prev => ({ ...prev, phoneNum: e.target.value }))}
                    className="mt-1 font-mono"
                    placeholder="+1234567890"
                    maxLength={13}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Create Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-10 font-mono"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrength().color}`}
                            style={{ width: `${(getPasswordStrength().score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {getPasswordStrength().text}
                        </span>
                      </div>
                      {getPasswordValidationMessage() && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-mono">
                          {getPasswordValidationMessage()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pr-10 font-mono"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  
                  {form.confirmPassword && (
                    <div className="mt-1 flex items-center space-x-2">
                      {form.password === form.confirmPassword ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-mono ${
                        form.password === form.confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {form.password === form.confirmPassword ? 'passwords match' : 'passwords do not match'}
                      </span>
                    </div>
                  )}

                {/* Password Requirements for Influencer Signup */}
                {form.password && (
                  <div className="border border-slate-200 dark:border-slate-700 rounded p-3 mt-4">
                    <p className="text-sm font-mono text-slate-600 dark:text-slate-400 mb-2">// Requirements:</p>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                      <div className={`${form.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {form.password.length >= 8 ? '✓' : '✗'} length {">"}= 8 characters
                      </div>
                      <div className={`${/[A-Z]/.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {/[A-Z]/.test(form.password) ? '✓' : '✗'} uppercase letter (A-Z)
                      </div>
                      <div className={`${/[a-z]/.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {/[a-z]/.test(form.password) ? '✓' : '•'} lowercase letter (a-z)
                      </div>
                      <div className={`${/[0-9]/.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {/[0-9]/.test(form.password) ? '✓' : '✗'} number (0-9)
                      </div>
                      <div className={`${form.password === form.confirmPassword && form.confirmPassword.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {form.password === form.confirmPassword && form.confirmPassword.length > 0 ? '✓' : '✗'} passwords match
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {"}"}
              </div>

              <HoverBorderGradient
                containerClassName="rounded-xl w-full"
                as="button"
                className={`w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium ${
                  loading || 
                  !form.email || 
                  !form.username ||
                  !form.password || 
                  form.password !== form.confirmPassword ||
                  form.password.length < 8 ||
                  !/[A-Z]/.test(form.password) ||
                  !/[0-9]/.test(form.password)
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                onClick={
                  loading || 
                  !form.email || 
                  !form.username ||
                  !form.password || 
                  form.password !== form.confirmPassword ||
                  form.password.length < 8 ||
                  !/[A-Z]/.test(form.password) ||
                  !/[0-9]/.test(form.password)
                    ? undefined 
                    : handleInfluencerSignup
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    creating_account...
                  </>
                ) : (
                  'create_account()'
                )}
              </HoverBorderGradient>
            </div>
          )}

          {/* Email Verification */}
          {step === 'email-verification' && (
            <div className="space-y-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                verify_email() {"{"}
              </div>
              
              <div className="space-y-4 pl-4">
                <div>
                  <Label htmlFor="display-email-verification" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="display-email-verification"
                    type="email"
                    value={userInfo?.email || form.email}
                    disabled
                    className="mt-1 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="verificationCode" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Verification Code
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    value={form.verificationCode}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      verificationCode: e.target.value.replace(/[^0-9]/g, '') 
                    }))}
                    className="mt-1 font-mono text-center text-xl tracking-[0.3em] font-bold"
                    placeholder="123456"
                    maxLength={6}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500 font-mono">
                    // 6-digit code from your email
                  </p>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="text-sm font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline hover:no-underline disabled:opacity-50"
                  >
                    {loading ? 'sending...' : 'resend_code()'}
                  </button>
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {"}"}
              </div>

              <HoverBorderGradient
                containerClassName="rounded-xl w-full"
                as="button"
                className={`w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium ${
                  loading || form.verificationCode.length !== 6 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                onClick={(e: React.FormEvent) => {
                  if (loading || form.verificationCode.length !== 6) return;
                  handleEmailVerification(e);
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    verifying...
                  </>
                ) : (
                  'verify_email()'
                )}
              </HoverBorderGradient>

              {/* Help section */}
              <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 mt-6">
                <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-2">
                  // Can't find your verification code?
                </p>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                  <div>• Check spam/junk folder</div>
                  <div>• Look for verify@influencerflow.in</div>
                  <div>• Code expires in 15 minutes</div>
                  <div>• Contact support@influencerflow.in</div>
                </div>
              </div>
            </div>
          )}

          {/* Password Setup (same as before) */}
          {step === 'password-setup' && (
            <div className="space-y-6">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                setup_password() {"{"}
              </div>
              
              <div className="space-y-4 pl-4">
                <div>
                  <Label htmlFor="display-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="display-email"
                    type="email"
                    value={userInfo?.email || form.email}
                    disabled
                    className="mt-1 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Create Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-10 font-mono"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrength().color}`}
                            style={{ width: `${(getPasswordStrength().score / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {getPasswordStrength().text}
                        </span>
                      </div>
                      {getPasswordValidationMessage() && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-mono">
                          {getPasswordValidationMessage()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pr-10 font-mono"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  
                  {form.confirmPassword && (
                    <div className="mt-1 flex items-center space-x-2">
                      {form.password === form.confirmPassword ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-mono ${
                        form.password === form.confirmPassword ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {form.password === form.confirmPassword ? 'passwords match' : 'passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded p-3">
                  <p className="text-sm font-mono text-slate-600 dark:text-slate-400 mb-2">// Requirements:</p>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                    <div className={`${form.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {form.password.length >= 8 ? '✓' : '✗'} length {">"}= 8 characters
                    </div>
                    <div className={`${/[A-Z]/.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {/[A-Z]/.test(form.password) ? '✓' : '✗'} uppercase letter (A-Z)
                    </div>
                    <div className={`${/[a-z]/.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {/[a-z]/.test(form.password) ? '✓' : '•'} lowercase letter (a-z)
                    </div>
                    <div className={`${/[0-9]/.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {/[0-9]/.test(form.password) ? '✓' : '✗'} number (0-9)
                    </div>
                    <div className={`${form.password === form.confirmPassword && form.password.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {form.password === form.confirmPassword && form.password.length > 0 ? '✓' : '✗'} passwords match
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
                {"}"}
              </div>

              <HoverBorderGradient
                containerClassName="rounded-xl w-full"
                as="button"
                className={`w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium ${
                  loading || 
                  !form.password || 
                  form.password !== form.confirmPassword ||
                  form.password.length < 8 ||
                  !/[A-Z]/.test(form.password) ||
                  !/[0-9]/.test(form.password)
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                onClick={
                  loading || 
                  !form.password || 
                  form.password !== form.confirmPassword ||
                  form.password.length < 8 ||
                  !/[A-Z]/.test(form.password) ||
                  !/[0-9]/.test(form.password)
                    ? undefined 
                    : handlePasswordSetup
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    activating...
                  </>
                ) : (
                  'activate_account()'
                )}
              </HoverBorderGradient>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-slate-600 dark:text-slate-400" />
              </div>
              
              <div>
                <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-2">
                  // Welcome {userInfo?.name || userInfo?.username || 'User'}
                </p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {userType === 'brand' ? 'Brand Account' : 'Influencer Account'} {loginMode === 'influencer-signup' ? 'Created' : 'Activated'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Redirecting to dashboard...
                </p>
              </div>

              <div className="space-y-3">
                <HoverBorderGradient
                  containerClassName="rounded-xl w-full"
                  as="button"
                  className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center justify-center px-6 py-3 text-base font-medium"
                  onClick={() => {
                    // Route to appropriate dashboard based on user type
                    const dashboardUrl = userType === 'brand' 
                      ? '/dashboard'                    // Brand dashboard
                      : '/creator/dashboard';           // Creator dashboard
                    
                    // Since we're on same domain, use relative URLs
                    window.location.href = dashboardUrl;
                  }}
                >
                  access_dashboard()
                </HoverBorderGradient>
                
                <HoverBorderGradient
                  containerClassName="rounded-xl w-full"
                  as="button"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono flex items-center justify-center px-6 py-3 text-base font-medium border border-slate-200 dark:border-slate-700"
                  onClick={resetToStart}
                >
                  restart()
                </HoverBorderGradient>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default UserLogin;