// api/user-auth.ts - Working Vercel port of your Netlify function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SUPABASE_URL (direct):', process.env.SUPABASE_URL ? 'Set ✓' : 'Missing ❌');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set ✓' : 'Missing ❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✓' : 'Missing ❌');

// Show first/last 10 characters of keys for veriffication (don't show full keys)
if (process.env.SUPABASE_URL) {
  console.log('SUPABASE_URL preview:', 
    process.env.SUPABASE_URL.substring(0, 20) + '...' + 
    process.env.SUPABASE_URL.substring(process.env.SUPABASE_URL.length - 10)
  );
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SERVICE_KEY preview:', 
    process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' + 
    process.env.SUPABASE_SERVICE_ROLE_KEY.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 10)
  );
} else {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is completely missing!');
}

console.log('=== END DEBUG ===');

// Supabase client setup (equivalent to your lib/supabase.ts)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://eepxrnqcefpvzxqkpjaw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Type definitions (same as your Netlify version)
interface InvitationLoginRequest {
  action: 'verify-invitation';
  email: string;
  code: string;
  userType: 'brand' | 'influencer';
}

interface EmailLoginRequest {
  action: 'email-login';
  email: string;
  password: string;
  userType: 'brand' | 'influencer';
}

interface PasswordSetupRequest {
  action: 'setup-password';
  email: string;
  password: string;
  userType: 'brand' | 'influencer';
}

interface InfluencerSignupRequest {
  action: 'influencer-signup';
  email: string;
  password: string;
  username: string;
  bio: string;
  phoneNum: string;
}


interface PasswordResetRequest {
  action: 'reset-password';
  email: string;
  userType: 'brand' | 'influencer';
}

interface VerifyEmailRequest {
  action: 'verify-email';
  email: string;
  code: string;
}

interface ResendVerificationRequest {
  action: 'resend-verification';
  email: string;
}

type AuthRequest = InvitationLoginRequest | EmailLoginRequest | PasswordSetupRequest | InfluencerSignupRequest | VerifyEmailRequest | ResendVerificationRequest | PasswordResetRequest;

interface AuthResponse {
  success: boolean;
  user?: {
    id?: string;
    email: string;
    name?: string;
    brand?: string;
    username?: string;
    userType?: 'brand' | 'influencer';
    requiresPasswordSetup: boolean;
    invitationVerified?: boolean;
    accessToken?: string;
    refreshToken?: string;
    accountActivated?: boolean;
    emailVerificationRequired?: boolean;
    emailVerified?: boolean;
    profileExists?: boolean;
  };
  error?: string;
}

// CORS headers (adapted for Vercel)
const getCorsHeaders = (origin: string | undefined) => {
  const allowedOrigins = [
    'https://influencerflow.in',
    'https://www.influencerflow.in',
    'https://app.influencerflow.in'
  ];
  
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    allowedOrigins.push(
      'http://localhost:3000', 
      'http://localhost:8888', 
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    );
  }
  
  const allowedOrigin = origin && allowedOrigins.some(allowed => 
    origin.includes(allowed.replace('https://', '').replace('http://', ''))
  ) ? origin : 'https://influencerflow.in';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  };
};

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};



const handlePasswordReset = async (email: string, userType: 'brand' | 'influencer'): Promise<AuthResponse> => {
  try {
    console.log(`Processing password reset for ${userType}: ${email}`);

    // First, verify the user exists and get their info
    let userExists = false;
    let userName = '';

    if (userType === 'brand') {
      // Check if brand exists in early_access_requests
      const { data: brandData, error: brandError } = await supabase
        .from('early_access_requests')
        .select('name, email, status, password_setup_completed')
        .eq('email', email.toLowerCase())
        .single();

      if (brandError) {
        console.log('Brand lookup error:', brandError.message);
      }

      if (brandData && brandData.password_setup_completed) {
        userExists = true;
        userName = brandData.name;
      }
    } else {
      // Check if influencer exists
      const { data: influencerData, error: influencerError } = await supabase
        .from('influencers')
        .select('influencer_username, influencer_email')
        .eq('influencer_email', email.toLowerCase())
        .single();

      if (influencerError) {
        console.log('Influencer lookup error:', influencerError.message);
      }

      if (influencerData) {
        userExists = true;
        userName = influencerData.influencer_username;
      }
    }

    if (!userExists) {
      return {
        success: false,
        error: `No ${userType} account found with this email address. Please check your email or sign up for a new account.`
      };
    }

    // Determine the correct redirect URL based on environment
    let redirectUrl: string;
    
    // Check environment and set appropriate redirect URL
    if (process.env.NODE_ENV === 'development') {
      redirectUrl = `http://localhost:3000/auth/reset-password?type=${userType}`;
    } else {
      // For production, use your actual domain
      redirectUrl = `https://app.influencerflow.in/auth/reset-password?type=${userType}`;
    }

    console.log('Using redirect URL:', redirectUrl);

    // Use Supabase's built-in password reset functionality
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Password reset error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('not found')) {
        return {
          success: false,
          error: 'No account found with this email address. Please check your email or sign up.'
        };
      }
      
      if (error.message?.includes('rate limit')) {
        return {
          success: false,
          error: 'Too many password reset attempts. Please wait a few minutes before trying again.'
        };
      }
      
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again or contact support.'
      };
    }

    console.log(`Password reset email sent successfully to ${email}`);

    return {
      success: true,
      user: {
        email: email.toLowerCase(),
        name: userName,
        userType: userType,
        requiresPasswordSetup: false,
        accountActivated: true
      }
    };

  } catch (error) {
    console.error('Error processing password reset:', error);
    return {
      success: false,
      error: 'Failed to process password reset request. Please try again.'
    };
  }
};


// Send email verification code using Brevo
const sendVerificationEmail = async (email: string, username: string, verificationCode: string) => {
  const brevoApiKey = process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    throw new Error('Brevo API key not configured');
  }

  const emailData = {
    sender: {
      name: "Team InfluencerFlow AI",
      email: "verify@influencerflow.in"
    },
    replyTo: {
      name: "Support InfluencerFlow",
      email: "support@influencerflow.in"
    },
    to: [{
      email: email,
      name: username
    }],
    subject: "🔐 Verify Your InfluencerFlow Account",
    
    htmlContent: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account - InfluencerFlow</title>
    <style>
      @media (prefers-color-scheme: dark) {
        .email-container { background-color: #141414 !important; }
        .email-body { background-color: #141414 !important; }
        .heading-primary { color: #f8fafc !important; }
        .text-primary { color: #f8fafc !important; }
        .text-secondary { color: #cbd5e1 !important; }
        .code-bg { background-color: #1e293b !important; color: #f8fafc !important; }
        .border-light { border-color: #334155 !important; }
        .brand-name { color: #f8fafc !important; }
        .verification-code { background-color: #1e293b !important; border-color: #334155 !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; line-height: 1.6;" class="email-body">
    
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;" class="email-container">
      
      <!-- Header -->
      <div style="padding: 40px 40px 20px 40px;">
        <div style="display: flex; align-items: center; margin-bottom: 40px;">
          <div style="width: 32px; height: 32px; margin-right: 12px;">
            <img src="https://assets.influencerflow.in/logos/png/if-bg-w.png" alt="InfluencerFlow Logo" style="width: 90%; height: 90%; object-fit: contain;">
          </div>
          <span style="font-family: 'SF Mono', Monaco, monospace; font-size: 18px; font-weight: 600; color: #141414; letter-spacing: -0.025em;" class="brand-name">InfluencerFlow.in</span>
        </div>
        
        <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 600; color: #141414; letter-spacing: -0.025em; line-height: 1.2;" class="heading-primary">
          Verify Your Email
        </h1>
        
        <p style="font-family: 'SF Mono', Monaco, monospace; margin: 0; font-size: 16px; color: #64748b; font-weight: 400; line-height: 1.6;" class="text-secondary">
          // Confirm your creator account
        </p>
      </div>
      
      <!-- Main Content -->
      <div style="padding: 0 40px 40px 40px;">
        
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #141414; font-weight: 500;" class="text-primary">
          Hi ${username},
        </p>
        
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #64748b; line-height: 1.6;" class="text-secondary">
          Welcome to InfluencerFlow! To complete your creator account setup, please verify your email address using the verification code below.
        </p>
        
        <!-- Verification Code -->
        <h2 style="font-family: 'SF Mono', Monaco, monospace; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #141414;" class="text-primary">
          verification_code() {
        </h2>
        
        <div style="background-color: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 32px; margin: 24px 0; text-align: center;" class="verification-code">
          <p style="font-family: 'SF Mono', Monaco, monospace; margin: 0 0 16px 0; font-size: 14px; color: #64748b;" class="text-secondary">
            // Your 6-digit verification code
          </p>
          <div style="font-family: 'SF Mono', Monaco, monospace; font-size: 36px; font-weight: 700; color: #141414; letter-spacing: 8px; margin: 16px 0;" class="text-primary">
            ${verificationCode}
          </div>
          <p style="font-family: 'SF Mono', Monaco, monospace; margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
            expires_in: 15_minutes | single_use: true
          </p>
        </div>
        
        <p style="font-family: 'SF Mono', Monaco, monospace; margin: 0 0 32px 0; font-size: 14px; color: #64748b;" class="text-secondary">
          }
        </p>
        
        <!-- Instructions -->
        <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <p style="margin: 0 0 12px 0; font-size: 15px; color: #141414; font-weight: 500;" class="text-primary">
            Next steps:
          </p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;" class="text-secondary">
            1. Return to the verification page
          </p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;" class="text-secondary">
            2. Enter the 6-digit code above
          </p>
          <p style="margin: 0; font-size: 14px; color: #64748b;" class="text-secondary">
            3. Start creating amazing content!
          </p>
        </div>
        
        <!-- Security Note -->
        <div style="border-left: 3px solid #e2e8f0; padding-left: 20px; margin: 32px 0;" class="border-light">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; font-weight: 500;" class="text-secondary">
            Security tip:
          </p>
          <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;" class="text-secondary">
            This code expires in 15 minutes. If you didn't create an account, please ignore this email.
          </p>
        </div>
        
      </div>
      
      <!-- Footer -->
      <div style="padding: 32px 40px; border-top: 1px solid #e2e8f0;" class="border-light">
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #64748b;" class="text-secondary">
          Need help? Contact us at <a href="mailto:support@influencerflow.in" style="color: #64748b;">support@influencerflow.in</a>
        </p>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #141414; font-weight: 500;" class="text-primary">
          The InfluencerFlow Team
        </p>
        
        <p style="font-family: 'SF Mono', Monaco, monospace; margin: 0; font-size: 12px; color: #94a3b8;">
          // This verification was sent to ${email}
        </p>
      </div>
      
    </div>
    
  </body>
</html>
    `
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': brevoApiKey
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Brevo API error:', errorData);
    throw new Error(`Failed to send verification email: ${response.statusText}`);
  }

  return await response.json();
};

// Verify invitation code (your working Netlify logic)
const verifyInvitationCode = async (email: string, code: string, userType: 'brand' | 'influencer'): Promise<AuthResponse> => {
  try {
    if (userType !== 'brand') {
      return {
        success: false,
        error: 'Invitation codes are only for brand accounts. Influencers can sign up directly.'
      };
    }

    console.log(`Verifying brand invitation code for ${email}`);

    const { data: invitation, error: inviteError } = await supabase
      .from('invitation_codes')
      .select(`
        *,
        early_access_requests (
          id,
          name,
          email,
          brand,
          status,
          password_setup_completed
        )
      `)
      .eq('email', email.toLowerCase())
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invitation) {
      console.log('Invalid invitation code:', { email, code, error: inviteError });
      
      const { data: expiredInvite } = await supabase
        .from('invitation_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code.toUpperCase())
        .single();

      if (expiredInvite) {
        if (expiredInvite.used) {
          return {
            success: false,
            error: 'This invitation code has already been used. Please contact support if you need a new code.'
          };
        } else {
          return {
            success: false,
            error: 'This invitation code has expired. Please contact support for a new code.'
          };
        }
      }

      return {
        success: false,
        error: 'Invalid invitation code. Please check your email for the correct 6-character code.'
      };
    }

    const userRequest = invitation.early_access_requests;
    if (!userRequest || userRequest.status !== 'approved') {
      return {
        success: false,
        error: 'Your application is not approved. Please contact support for assistance.'
      };
    }

    if (userRequest.password_setup_completed) {
      return {
        success: false,
        error: 'Your account is already activated. Please use the regular login form with your email and password.'
      };
    }

    const { error: updateError } = await supabase
      .from('invitation_codes')
      .update({ 
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Failed to mark invitation as used:', updateError);
      return {
        success: false,
        error: 'Failed to process invitation. Please try again.'
      };
    }

    console.log(`Invitation code verified for ${email}`);

    return {
      success: true,
      user: {
        email: email.toLowerCase(),
        name: userRequest.name,
        brand: userRequest.brand,
        userType: 'brand',
        requiresPasswordSetup: true,
        invitationVerified: true
      }
    };

  } catch (error) {
    console.error('Error verifying invitation code:', error);
    return {
      success: false,
      error: 'Failed to verify invitation code. Please try again.'
    };
  }
};


const handleInfluencerSignup = async (
  email: string, 
  password: string, 
  username: string, 
  bio: string, 
  phoneNum: string
): Promise<AuthResponse> => {
  try {
    console.log(`Creating influencer account for ${email}`);

    // Validate inputs
    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasNumber) {
      return {
        success: false,
        error: 'Password must contain at least one uppercase letter and one number'
      };
    }

    if (!username.trim()) {
      return {
        success: false,
        error: 'Username is required'
      };
    }

    // Check if email already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingUser.users.some(user => user.email === email.toLowerCase());
    
    if (emailExists) {
      return {
        success: false,
        error: 'An account with this email already exists. Try logging in instead.'
      };
    }

    // Check if username already exists
    const { data: existingInfluencer } = await supabase
      .from('influencers')
      .select('id')
      .eq('influencer_username', username.trim())
      .single();

    if (existingInfluencer) {
      return {
        success: false,
        error: 'This username is already taken. Please choose a different one.'
      };
    }

    // Create user in Supabase Auth (email not confirmed initially)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false,
      user_metadata: {
        username: username.trim(),
        userType: 'influencer',
        account_activated: false,
        created_via: 'influencer_signup',
        password_set_at: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('Failed to create influencer in Supabase Auth:', authError);
      
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        return {
          success: false,
          error: 'An account with this email already exists. Try logging in instead.'
        };
      }
      
      return {
        success: false,
        error: `Failed to create account: ${authError.message}`
      };
    }

    // Create influencer profile
    const { error: influencerError } = await supabase
      .from('influencers')
      .insert({
        id: authData.user.id,
        influencer_username: username.trim(),
        influencer_email: email.toLowerCase(),
        bio: bio.trim() || null,
        phone_num: phoneNum.trim() || null,
        created_at: new Date().toISOString()
      });

    if (influencerError) {
      console.error('Failed to create influencer profile:', influencerError);
      
      // Clean up the auth user if profile creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return {
        success: false,
        error: 'Failed to create influencer profile. Please try again.'
      };
    }

    // Generate and send verification code
    let verificationCode: string;
    let codeExists = true;
    
    do {
      verificationCode = generateVerificationCode();
      const { data: existingCode } = await supabase
        .from('email_verification_codes')
        .select('id')
        .eq('code', verificationCode)
        .eq('used', false)
        .single();
      
      codeExists = !!existingCode;
    } while (codeExists);

    // Store verification code
    const { error: codeError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: email.toLowerCase(),
        code: verificationCode,
        user_id: authData.user.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        used: false
      });

    if (codeError) {
      console.error('Failed to store verification code:', codeError);
      return {
        success: false,
        error: 'Failed to generate verification code. Please try again.'
      };
    }

    // Send verification email
    await sendVerificationEmail(email.toLowerCase(), username.trim(), verificationCode);

    console.log(`Influencer account created successfully for ${email}, verification email sent`);

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: email.toLowerCase(),
        username: username.trim(),
        userType: 'influencer',
        requiresPasswordSetup: false,
        accountActivated: false,
        emailVerificationRequired: true
      }
    };

  } catch (error) {
    console.error('Error creating influencer account:', error);
    return {
      success: false,
      error: 'Failed to create influencer account. Please try again.'
    };
  }
};

const handleEmailLogin = async (email: string, password: string, userType: 'brand' | 'influencer'): Promise<AuthResponse> => {
  try {
    console.log(`Attempting ${userType} login for ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (error || !data.user) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.'
      };
    }

    // Verify user type matches
    const userMetaType = data.user.user_metadata?.userType;
    if (userMetaType && userMetaType !== userType) {
      return {
        success: false,
        error: `This account is registered as a ${userMetaType}. Please use the correct login tab.`
      };
    }

    let userName = '';
    let brandName = '';
    let username = '';
    let profileExists = undefined;

    if (userType === 'brand') {
      // Get brand info from early_access_requests
      const { data: brandData } = await supabase
        .from('early_access_requests')
        .select('name, brand')
        .eq('email', email.toLowerCase())
        .single();
      userName = brandData?.name || '';
      brandName = brandData?.brand || '';
      // Check if brand profile exists
      const { data: brandProfile } = await supabase
        .from('brands')
        .select('id')
        .eq('id', data.user.id)
        .single();
      profileExists = !!brandProfile;
    } else {
      // Get influencer info
      const { data: influencerData } = await supabase
        .from('influencers')
        .select('influencer_username')
        .eq('influencer_email', email.toLowerCase())
        .single();
      username = influencerData?.influencer_username || data.user.user_metadata?.username || '';
    }

    console.log(`${userType} login successful for ${email}`);

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || '',
        name: userName,
        brand: brandName,
        username: username,
        userType: userType,
        requiresPasswordSetup: false,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        accountActivated: true,
        ...(userType === 'brand' ? { profileExists } : {})
      }
    };
  } catch (error) {
    console.error('Email login error:', error);
    return {
      success: false,
      error: 'Login failed. Please try again.'
    };
  }
};

const handlePasswordSetup = async (email: string, password: string, userType: 'brand' | 'influencer'): Promise<AuthResponse> => {
  try {
    console.log(`Setting up password for ${userType}: ${email}`);

    if (userType !== 'brand') {
      return {
        success: false,
        error: 'Password setup is only for brand accounts with invitations.'
      };
    }

    // Validate password
    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long'
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasNumber) {
      return {
        success: false,
        error: 'Password must contain at least one uppercase letter and one number'
      };
    }

    // Get user info from early_access_requests
    const { data: userRequest, error: userError } = await supabase
      .from('early_access_requests')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'approved')
      .single();

    if (userError || !userRequest) {
      console.error('User request not found:', userError);
      return {
        success: false,
        error: 'User account not found or not approved. Please contact support.'
      };
    }

    if (userRequest.password_setup_completed) {
      return {
        success: false,
        error: 'Account already activated. Please use the regular login form.'
      };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        name: userRequest.name,
        brand: userRequest.brand,
        userType: 'brand',
        requires_password_setup: false,
        account_activated: true,
        invitation_signup: true,
        created_via: 'invitation_flow',
        password_set_at: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('Failed to create user in Supabase Auth:', authError);
      
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        return {
          success: false,
          error: 'An account with this email already exists. Try logging in instead.'
        };
      }
      
      return {
        success: false,
        error: `Failed to create account: ${authError.message}`
      };
    }

    // Create brand profile
    const { error: brandError } = await supabase
      .from('brands')
      .insert({
        id: authData.user.id,
        brand_name: userRequest.brand,
        brand_description: null,
        location: null,
        created_at: new Date().toISOString()
      });

    if (brandError) {
      console.error('Failed to create brand profile:', brandError);
    }

    // Update early_access_requests
    const { error: requestUpdateError } = await supabase
      .from('early_access_requests')
      .update({
        password_setup_completed: true,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (requestUpdateError) {
      console.error('Failed to update early access request:', requestUpdateError);
    }

    // Auto-login
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      });

      if (signInError) {
        console.error('Auto-login error:', signInError);
      } else if (signInData.session) {
        accessToken = signInData.session.access_token;
        refreshToken = signInData.session.refresh_token;
      }
    } catch (signInError) {
      console.error('Failed to auto-login after password setup:', signInError);
    }

    console.log(`Password setup completed for ${email}`);

    return {
      success: true,
      user: {
        id: authData.user.id,
        email: email.toLowerCase(),
        name: userRequest.name,
        brand: userRequest.brand,
        userType: 'brand',
        requiresPasswordSetup: false,
        accessToken,
        refreshToken,
        accountActivated: true
      }
    };

  } catch (error) {
    console.error('Error setting up password:', error);
    return {
      success: false,
      error: 'Failed to set up password. Please try again.'
    };
  }
};

// Email verification function (from your Netlify version)
const handleEmailVerification = async (email: string, code: string): Promise<AuthResponse> => {
  try {
    console.log(`Verifying email for ${email}`);

    // Find valid verification code
    const { data: verificationCode, error: codeError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeError || !verificationCode) {
      console.log('Invalid verification code:', { email, code, error: codeError });
      
      // Check if code exists but is expired
      const { data: expiredCode } = await supabase
        .from('email_verification_codes')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('code', code)
        .single();

      if (expiredCode) {
        if (expiredCode.used) {
          return {
            success: false,
            error: 'This verification code has already been used. Please request a new code.'
          };
        } else {
          return {
            success: false,
            error: 'This verification code has expired. Please request a new code.'
          };
        }
      }

      return {
        success: false,
        error: 'Invalid verification code. Please check your email for the correct 6-digit code.'
      };
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('email_verification_codes')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', verificationCode.id);

    if (updateError) {
      console.error('Failed to mark code as used:', updateError);
      return {
        success: false,
        error: 'Failed to verify email. Please try again.'
      };
    }

    // Update user's email confirmation in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(verificationCode.user_id, {
      email_confirm: true,
      user_metadata: {
        account_activated: true,
        email_verified_at: new Date().toISOString()
      }
    });

    if (authError) {
      console.error('Failed to confirm email in auth:', authError);
      return {
        success: false,
        error: 'Failed to verify email. Please try again.'
      };
    }

    // Get user info for response
    const { data: influencerData } = await supabase
      .from('influencers')
      .select('influencer_username')
      .eq('influencer_email', email.toLowerCase())
      .single();

    console.log(`Email verified successfully for ${email}`);

    return {
      success: true,
      user: {
        id: verificationCode.user_id,
        email: email.toLowerCase(),
        username: influencerData?.influencer_username || '',
        userType: 'influencer',
        requiresPasswordSetup: false,
        accountActivated: true,
        emailVerified: true
      }
    };

  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      error: 'Failed to verify email. Please try again.'
    };
  }
};

// Resend verification code function (from your Netlify version)
const handleResendVerification = async (email: string): Promise<AuthResponse> => {
  try {
    console.log(`Resending verification code for ${email}`);

    // Get user info
    const { data: influencerData, error: userError } = await supabase
      .from('influencers')
      .select('influencer_username, id')
      .eq('influencer_email', email.toLowerCase())
      .single();

    if (userError || !influencerData) {
      return {
        success: false,
        error: 'Account not found. Please sign up first.'
      };
    }

    // Check if email is already verified
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(influencerData.id);
    
    if (authError) {
      return {
        success: false,
        error: 'Failed to check account status. Please try again.'
      };
    }

    if (authUser.user?.email_confirmed_at) {
      return {
        success: false,
        error: 'Email is already verified. You can log in directly.'
      };
    }

    // Mark old codes as used
    await supabase
      .from('email_verification_codes')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false);

    // Generate new verification code
    let verificationCode: string;
    let codeExists = true;
    
    do {
      verificationCode = generateVerificationCode();
      const { data: existingCode } = await supabase
        .from('email_verification_codes')
        .select('id')
        .eq('code', verificationCode)
        .eq('used', false)
        .single();
      
      codeExists = !!existingCode;
    } while (codeExists);

    // Store new verification code
    const { error: codeError } = await supabase
      .from('email_verification_codes')
      .insert({
        email: email.toLowerCase(),
        code: verificationCode,
        user_id: influencerData.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        used: false
      });

    if (codeError) {
      console.error('Failed to store new verification code:', codeError);
      return {
        success: false,
        error: 'Failed to generate new verification code. Please try again.'
      };
    }

    // Send new verification email
    await sendVerificationEmail(email.toLowerCase(), influencerData.influencer_username, verificationCode);

    console.log(`New verification code sent to ${email}`);

    return {
      success: true,
      user: {
        email: email.toLowerCase(),
        username: influencerData.influencer_username,
        userType: 'influencer',
        requiresPasswordSetup: false,
        accountActivated: false,
        emailVerificationRequired: true
      }
    };

  } catch (error) {
    console.error('Error resending verification code:', error);
    return {
      success: false,
      error: 'Failed to resend verification code. Please try again.'
    };
  }
};

// Main Vercel handler (adapted from your Netlify handler)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('User auth function invoked:', {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const headers = getCorsHeaders(req.headers.origin as string);

  // Set CORS headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Parse request body (Vercel difference from Netlify)
    const requestBody = req.body as AuthRequest;

    if (!requestBody.action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    if (!requestBody.email || typeof requestBody.email !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    let result: AuthResponse;

    switch (requestBody.action) {
      case 'verify-invitation':
        if (!requestBody.code || typeof requestBody.code !== 'string' || requestBody.code.length !== 6) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid 6-character invitation code is required' 
          });
        }

        if (!requestBody.userType || !['brand', 'influencer'].includes(requestBody.userType)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid user type is required' 
          });
        }

        result = await verifyInvitationCode(requestBody.email.trim(), requestBody.code.trim(), requestBody.userType);
        break;

      case 'email-login':
        if (!requestBody.password || typeof requestBody.password !== 'string') {
          return res.status(400).json({ 
            success: false, 
            error: 'Password is required' 
          });
        }

        if (!requestBody.userType || !['brand', 'influencer'].includes(requestBody.userType)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid user type is required' 
          });
        }

        result = await handleEmailLogin(requestBody.email.trim(), requestBody.password, requestBody.userType);
        break;

      case 'setup-password':
        if (!requestBody.password || typeof requestBody.password !== 'string' || requestBody.password.length < 8) {
          return res.status(400).json({ 
            success: false, 
            error: 'Password must be at least 8 characters long' 
          });
        }

        if (!requestBody.userType || !['brand', 'influencer'].includes(requestBody.userType)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid user type is required' 
          });
        }

        result = await handlePasswordSetup(requestBody.email.trim(), requestBody.password, requestBody.userType);
        break;

      case 'influencer-signup':
        if (!requestBody.password || typeof requestBody.password !== 'string' || requestBody.password.length < 8) {
          return res.status(400).json({ 
            success: false, 
            error: 'Password must be at least 8 characters long' 
          });
        }

        if (!requestBody.username || typeof requestBody.username !== 'string') {
          return res.status(400).json({ 
            success: false, 
            error: 'Username is required' 
          });
        }

        result = await handleInfluencerSignup(
          requestBody.email.trim(),
          requestBody.password,
          requestBody.username.trim(),
          requestBody.bio || '',
          requestBody.phoneNum || ''
        );
        break;


        case 'reset-password':
        if (!requestBody.userType || !['brand', 'influencer'].includes(requestBody.userType)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid user type is required for password reset' 
          });
        }

        result = await handlePasswordReset(requestBody.email.trim(), requestBody.userType);
        break;

      case 'verify-email':
        if (!requestBody.code || typeof requestBody.code !== 'string' || requestBody.code.length !== 6) {
          return res.status(400).json({ 
            success: false, 
            error: 'Valid 6-digit verification code is required' 
          });
        }

        result = await handleEmailVerification(requestBody.email.trim(), requestBody.code.trim());
        break;

      case 'resend-verification':
        result = await handleResendVerification(requestBody.email.trim());
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: `Invalid action: ${(requestBody as { action: string }).action}` 
        });
    }

    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('User auth error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again.'
    });
  }
}