// Auth service library
export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
}

export async function signOut() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST'
  });
  
  if (response.ok) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
  
  return response.json();
}

export async function refreshToken(refreshToken: string) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  if (!response.ok) {
    throw new Error('Token refresh failed');
  }
  
  return response.json();
}

export async function validateToken(token: string) {
  const response = await fetch('/api/auth/validate', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token validation failed');
  }
  
  return response.json();
}