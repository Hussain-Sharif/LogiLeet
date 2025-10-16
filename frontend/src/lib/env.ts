export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:9000/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:9000',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
};
