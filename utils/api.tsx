import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-bb5c7597`;

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  accessToken?: string;
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {}, accessToken } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Auth APIs
export const authApi = {
  signup: async (email: string, password: string, name: string) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: { email, password, name },
    });
  },

  signin: async (email: string, password: string) => {
    return apiCall('/auth/signin', {
      method: 'POST',
      body: { email, password },
    });
  },

  getSession: async (accessToken: string) => {
    return apiCall('/auth/session', {
      accessToken,
    });
  },
};

// Business Cards APIs
export const cardsApi = {
  list: async (accessToken: string) => {
    return apiCall('/api/contacts', { accessToken });
  },

  get: async (id: string, accessToken: string) => {
    return apiCall(`/api/contact/${id}`, { accessToken });
  },

  create: async (cardData: any, accessToken: string) => {
    return apiCall('/api/save-contact', {
      method: 'POST',
      body: cardData,
      accessToken,
    });
  },

  update: async (id: string, cardData: any, accessToken: string) => {
    return apiCall(`/api/contact/${id}`, {
      method: 'PUT',
      body: cardData,
      accessToken,
    });
  },

  delete: async (id: string, accessToken: string) => {
    return apiCall(`/api/contact/${id}`, {
      method: 'DELETE',
      accessToken,
    });
  },
};

// Company Settings APIs
export const settingsApi = {
  getCompanySettings: async (accessToken: string) => {
    return apiCall('/settings/company', { accessToken });
  },

  updateCompanySettings: async (settings: any, accessToken: string) => {
    return apiCall('/settings/company', {
      method: 'PUT',
      body: settings,
      accessToken,
    });
  },

  getInquiryTypes: async (accessToken: string) => {
    return apiCall('/settings/inquiry-types', { accessToken });
  },

  createInquiryType: async (inquiryType: any, accessToken: string) => {
    return apiCall('/settings/inquiry-types', {
      method: 'POST',
      body: inquiryType,
      accessToken,
    });
  },

  updateInquiryType: async (id: string, inquiryType: any, accessToken: string) => {
    return apiCall(`/settings/inquiry-types/${id}`, {
      method: 'PUT',
      body: inquiryType,
      accessToken,
    });
  },

  deleteInquiryType: async (id: string, accessToken: string) => {
    return apiCall(`/settings/inquiry-types/${id}`, {
      method: 'DELETE',
      accessToken,
    });
  },
};

// Admin APIs
export const adminApi = {
  getWhitelist: async (accessToken: string) => {
    return apiCall('/admin/whitelist', { accessToken });
  },

  addToWhitelist: async (email: string, accessToken: string) => {
    return apiCall('/admin/whitelist', {
      method: 'POST',
      body: { email },
      accessToken,
    });
  },

  removeFromWhitelist: async (email: string, accessToken: string) => {
    return apiCall(`/admin/whitelist/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      accessToken,
    });
  },
};

// Interactions APIs
export const interactionsApi = {
  list: async (cardId: string, accessToken: string) => {
    return apiCall(`/cards/${cardId}/interactions`, { accessToken });
  },

  create: async (cardId: string, interaction: any, accessToken: string) => {
    return apiCall(`/cards/${cardId}/interactions`, {
      method: 'POST',
      body: interaction,
      accessToken,
    });
  },
};
