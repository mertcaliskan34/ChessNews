import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.PROD 
  ? 'http://localhost:3000' // Production backend URL
  : ''; // Development - use proxy

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Unknown error';
    const status = error.response?.status || 'Network Error';
    
    console.error(`❌ API Error [${status}]:`, message);
    
    // Enhance error with user-friendly messages
    if (error.response?.status === 404) {
      error.userMessage = 'Endpoint bulunamadı. Backend sunucusu çalışıyor mu?';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      error.userMessage = 'Backend sunucusuna bağlanılamıyor. Sunucunun çalıştığından emin olun.';
    } else {
      error.userMessage = message;
    }
    
    return Promise.reject(error);
  }
);

// API Endpoints
export const endpoints = {
  news: {
    getAll: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return `/api/news${searchParams.toString() ? `?${searchParams}` : ''}`;
    },
    getTSF: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return `/api/news/tsf${searchParams.toString() ? `?${searchParams}` : ''}`;
    },
    refreshTSF: () => '/api/news/tsf/refresh',
    getChessCom: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return `/api/news/chesscom${searchParams.toString() ? `?${searchParams}` : ''}`;
    },
    refreshChessCom: () => '/api/news/chesscom/refresh',
    getFeatured: (params?: Record<string, string>) => {
      const searchParams = new URLSearchParams(params);
      return `/api/news/featured${searchParams.toString() ? `?${searchParams}` : ''}`;
    }
  }
};

// Helper functions for common API operations
export const newsAPI = {
  getNews: async (source: string = 'all', limit: string = '20', refresh: boolean = false) => {
    const params: Record<string, string> = { source, limit };
    if (refresh) {
      params.refresh = 'true';
    }
    const response = await api.get(endpoints.news.getAll(params));
    return response.data;
  },
  
  getTSFNews: async (limit: string = '10') => {
    const response = await api.get(endpoints.news.getTSF({ limit }));
    return response.data;
  },
  
  refreshTSFNews: async () => {
    const response = await api.post(endpoints.news.refreshTSF());
    return response.data;
  },

  getChessComNews: async (limit: string = '10') => {
    const response = await api.get(endpoints.news.getChessCom({ limit }));
    return response.data;
  },
  
  refreshChessComNews: async () => {
    const response = await api.post(endpoints.news.refreshChessCom());
    return response.data;
  },

  getFeaturedNews: async (limit: string = '5') => {
    const response = await api.get(endpoints.news.getFeatured({ limit }));
    return response.data;
  }
};

export default api; 