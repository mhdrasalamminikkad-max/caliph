// API configuration for different environments
export const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') // Use environment variable in production
  : ''; // Use relative URL in development (proxied by Vite)

export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if API_BASE_URL already ends with slash or if endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${cleanBase}${cleanEndpoint}`;
};

// Enhanced fetch with error handling for mobile/network issues
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 0 || response.status === 503) {
        throw new Error('Network error: Backend server unavailable. Check your internet connection.');
      }
      if (response.status === 404) {
        throw new Error(`API endpoint not found: ${endpoint}`);
      }
      
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    return response;
  } catch (error) {
    // Handle network errors (common on mobile)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
}

// JSON fetch wrapper
export async function apiFetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(endpoint, options);
  return response.json();
}






