// Instance Axios partagée par toute l'application
// Tous les appels API passent par ici
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de réponse : si le serveur répond 401 (token expiré/invalide),
// on efface la session persistée et on redirige vers la connexion.
// Exception : on ignore l'échec de /auth/login pour laisser le formulaire
// afficher son propre message d'erreur (sans recharger la page).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      // Nettoyage direct du sessionStorage (évite la dépendance circulaire au store)
      sessionStorage.removeItem('cmci_token');
      sessionStorage.removeItem('cmci_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
