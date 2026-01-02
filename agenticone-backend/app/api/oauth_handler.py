"""
OAuth 2.0 Token Exchange Handler for Google Authentication
"""
import httpx
import json
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from typing import Dict, Any
import secrets
import hashlib
import base64

router = APIRouter(prefix="/api/auth", tags=["oauth"])

# OAuth 2.0 Configuration
import os
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "835773828317-v3ce03jcca5o7nq09vs2tuc1tejke8du.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "your-client-secret-here")

def mask_value(value: str, visible: int = 4) -> str:
    if not value:
        return "NOT_SET"
    if len(value) <= visible:
        return "*" * len(value)
    return f"{'*' * (len(value) - visible)}{value[-visible:]}"

# Debug environment variables without leaking secrets
print("🔍 Environment check:")
print(f"   - GOOGLE_CLIENT_ID: {mask_value(GOOGLE_CLIENT_ID)}")
print(f"   - GOOGLE_CLIENT_SECRET set: {GOOGLE_CLIENT_SECRET != 'your-client-secret-here' and bool(GOOGLE_CLIENT_SECRET)}")
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

@router.post("/token")
async def exchange_code_for_tokens(request: Request):
    """Exchange authorization code for access tokens"""
    try:
        body = await request.json()
        code = body.get("code")
        redirect_uri = body.get("redirect_uri")
        client_id = body.get("client_id")
        code_verifier = body.get("code_verifier")
        
        # Enhanced logging
        print(f"🔍 OAuth token exchange request received:")
        print(f"   - Has code: {bool(code)}")
        print(f"   - Has verifier: {bool(code_verifier)}")
        print(f"   - Redirect URI: {redirect_uri}")
        print(f"   - Client ID: {mask_value(client_id)}")
        print(f"   - Has code: {bool(code)}")
        print(f"   - Has verifier: {bool(code_verifier)}")
        
        # Validate required parameters
        if not all([code, redirect_uri, client_id, code_verifier]):
            missing = []
            if not code: missing.append("code")
            if not redirect_uri: missing.append("redirect_uri")
            if not client_id: missing.append("client_id")
            if not code_verifier: missing.append("code_verifier")
            print(f"❌ Missing required parameters: {missing}")
            raise HTTPException(status_code=400, detail=f"Missing required parameters: {missing}")
        
        # Exchange code for tokens with proper content type
        # For PKCE flow, we include client_secret if available (for server-side apps)
        # but for public clients (SPAs), Google may still require it
        token_data = {
            "client_id": client_id,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier
        }
        
        # Add client_secret if we have it (for server-side OAuth apps)
        if GOOGLE_CLIENT_SECRET and GOOGLE_CLIENT_SECRET != "your-client-secret-here":
            token_data["client_secret"] = GOOGLE_CLIENT_SECRET
            print(f"📤 Using client_secret for server-side OAuth")
        else:
            print(f"📤 No client_secret (PKCE flow for public client)")
        
        print("📤 Sending token request to Google")
        
        async with httpx.AsyncClient() as client:
            # Use proper content type for Google OAuth
            response = await client.post(
                GOOGLE_TOKEN_URL, 
                data=token_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"📥 Google response status: {response.status_code}")
            
            if response.status_code != 200:
                error_detail = f"Google token exchange failed: {response.text}"
                print(f"❌ {error_detail}")
                raise HTTPException(status_code=400, detail=error_detail)
            
            token_response = response.json()
            print("✅ Token exchange successful")
            
            # Get user info
            user_info = await get_user_info(token_response["access_token"])
            print(f"✅ User info retrieved: {user_info.get('email', 'No email')}")
            
            return {
                "access_token": token_response["access_token"],
                "refresh_token": token_response.get("refresh_token"),
                "expires_in": token_response.get("expires_in"),
                "user_info": user_info
            }
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Unexpected error in token exchange: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

async def get_user_info(access_token: str) -> Dict[str, Any]:
    """Get user information from Google"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to get user info")
            
            return response.json()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/callback")
async def oauth_callback(
    code: str = None,
    state: str = None,
    error: str = None
):
    """Handle OAuth callback"""
    if error:
        return RedirectResponse(url=f"/?error={error}")
    
    if not code:
        return RedirectResponse(url="/?error=no_code")
    
    # In a real implementation, you would:
    # 1. Verify the state parameter
    # 2. Exchange the code for tokens
    # 3. Store tokens securely
    # 4. Redirect to the main app
    
    return RedirectResponse(url="/?code=success")

@router.post("/refresh")
async def refresh_token(request: Request):
    """Refresh access token using refresh token"""
    try:
        body = await request.json()
        refresh_token = body.get("refresh_token")
        
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Refresh token required")
        
        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=token_data)
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Token refresh failed")
            
            return response.json()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/revoke")
async def revoke_token(request: Request):
    """Revoke access token"""
    try:
        body = await request.json()
        token = body.get("token")
        
        if not token:
            raise HTTPException(status_code=400, detail="Token required")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/revoke",
                data={"token": token}
            )
            
            return {"status": "revoked"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
