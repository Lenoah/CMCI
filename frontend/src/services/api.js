// Instance Axios partagée par toute l'application
// Tous les appels API passent par ici
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de réponse : si le serveur répond 401 (token invalide),
// on redirige vers la page de connexion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirection vers /login sans utiliser le store (évite la dépendance circulaire)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
