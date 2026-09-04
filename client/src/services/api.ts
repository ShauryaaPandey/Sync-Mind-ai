import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('syncmind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('syncmind_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const searchMeetings = async (query: string) => {
  return API.post('/meetings/search', { query });
};

export const chatWithMeeting = async (meetingId: string, question: string) => {
  return API.post(`/meetings/${meetingId}/chat`, { question });
};

export default API;