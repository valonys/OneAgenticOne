// Standards-compliant Google OAuth 2.0 Authentication with PKCE
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  access_token: string;
  refresh_token?: string;
}

class OAuth2GoogleAuth {
  private user: GoogleUser | null = null;
  private listeners: Array<(user: GoogleUser | null) => void> = [];
  private clientId: string;
  private redirectUri: string;
  private scope: string;
  private apiBaseUrl: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '835773828317-v3ce03jcca5o7nq09vs2tuc1tejke8du.apps.googleusercontent.com';
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
    this.redirectUri = (frontendUrl || window.location.origin).replace(/\/$/, '');
    this.apiBaseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '');
    this.scope = 'openid profile email';
    
    // Check if we're returning from OAuth callback
    this.handleOAuthCallback();
  }

  private handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      this.showError('Authentication failed. Please try again or use guest mode.');
      return;
    }

    if (code && state) {
      this.exchangeCodeForTokens(code, state);
    }
  }

  private async exchangeCodeForTokens(code: string, state: string) {
    try {
      // Verify state parameter (CSRF protection)
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Get code verifier from session storage
      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      console.log('🔍 Exchanging code for tokens:', {
        code: code.substring(0, 10) + '...',
        hasVerifier: !!codeVerifier,
        redirectUri: this.redirectUri,
        clientId: this.clientId
      });

      // Exchange authorization code for tokens
      const response = await fetch(`${this.apiBaseUrl}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      
      // Get user info from Google
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      this.user = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      };

      // Store tokens securely (in memory for now, could use HTTP-only cookies)
      sessionStorage.setItem('access_token', tokenData.access_token);
      if (tokenData.refresh_token) {
        sessionStorage.setItem('refresh_token', tokenData.refresh_token);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Notify listeners
      this.listeners.forEach(listener => listener(this.user));
      
      console.log('✅ OAuth 2.0 login successful:', this.user);
    } catch (error) {
      console.error('Token exchange error:', error);
      this.showError('Authentication failed. Please try again or use guest mode.');
    }
  }

  private async getUserInfo(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  private generatePKCEChallenge() {
    // Generate code verifier
    const codeVerifier = this.generateRandomString(128);
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    // Generate code challenge
    return this.sha256(codeVerifier).then(hash => {
      return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    });
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  private async sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return await crypto.subtle.digest('SHA-256', data);
  }

  private generateState(): string {
    const state = this.generateRandomString(32);
    sessionStorage.setItem('oauth_state', state);
    return state;
  }

  private showError(message: string) {
    // Show user-friendly error message
    alert(message);
  }

  // Public methods
  async signIn() {
    try {
      console.log('Starting OAuth 2.0 flow...');
      
      // Generate PKCE challenge
      const codeChallenge = await this.generatePKCEChallenge();
      const state = this.generateState();
      
      // Build OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', this.clientId);
      authUrl.searchParams.set('redirect_uri', this.redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', this.scope);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      
      console.log('Redirecting to Google OAuth...');
      
      // Redirect to Google's OAuth consent screen
      window.location.href = authUrl.toString();
      
    } catch (error) {
      console.error('OAuth sign-in error:', error);
      throw new Error('OAuth sign-in failed. Please use guest mode instead.');
    }
  }

  // Guest sign-in method
  signInAsGuest(customName?: string) {
    console.log('Signing in as guest...');
    const guestName = customName || 'Guest User';
    this.user = {
      id: 'guest-' + Date.now(),
      email: 'guest@agenticone.com',
      name: guestName,
      picture: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=' + guestName.charAt(0).toUpperCase(),
      access_token: 'guest-token-' + Date.now()
    };

    // Notify all listeners
    this.listeners.forEach(listener => listener(this.user));
    console.log('✅ Guest login successful:', this.user);
  }

  async signOut() {
    try {
      // Revoke Google tokens if available
      const accessToken = sessionStorage.getItem('access_token');
      if (accessToken) {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `token=${accessToken}`
        });
      }
    } catch (error) {
      console.error('Token revocation error:', error);
    }
    
    // Clear stored tokens
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('oauth_state');
    
    this.user = null;
    this.listeners.forEach(listener => listener(null));
  }

  getCurrentUser(): GoogleUser | null {
    return this.user;
  }

  onAuthStateChanged(callback: (user: GoogleUser | null) => void) {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get authorization header for API calls
  getAuthHeader(): string | null {
    return this.user ? `Bearer ${this.user.access_token}` : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.user !== null;
  }
}

// Create singleton instance
export const auth = new OAuth2GoogleAuth();

export type { GoogleUser };
