// Custodial fetch wrapper that injects school sandboxing context
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<any> {
  // Retrieve active session or school context from localStorage
  const sessionStr = localStorage.getItem('gsms_session');
  let schoolName = '';
  let userEmail = '';
  let userRole = '';
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      schoolName = session.user?.schoolName || '';
      userEmail = session.user?.email || '';
      userRole = session.user?.role || '';
    } catch (e) {
      console.error('Error reading session for header injection', e);
    }
  }

  // Set up headers
  const headers = new Headers(options.headers || {});
  if (schoolName) {
    headers.set('X-School-Name', schoolName);
  }
  if (userEmail) {
    headers.set('X-User-Email', userEmail);
  }
  if (userRole) {
    headers.set('X-User-Role', userRole);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal
    });
    
    clearTimeout(id);

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { error: errorText };
      }
      throw new Error(errorObj.error || errorObj.message || `HTTP ${response.status} Error`);
    }

    try {
      return await response.json();
    } catch (err: any) {
      throw new Error(`Invalid JSON response from server (HTTP ${response.status}).`);
    }
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('API Request timed out (grace-degradation threshold exceeded).');
    }
    throw error;
  }
}
