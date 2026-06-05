// Store Pinia pour l'authentification.
// NOTE : à la demande de l'utilisateur, la session est persistée dans
// sessionStorage (et non localStorage) : la connexion survit au rafraîchissement
// MAIS chaque onglet a sa propre session isolée → on peut être connecté avec
// plusieurs comptes en même temps (un par onglet). Fermer l'onglet déconnecte.
// (Déroge à la consigne « Pinia uniquement » du CLAUDE.md.)
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

// Clés de stockage local (token JWT + profil utilisateur)
const TOKEN_KEY = 'cmci_token';
const USER_KEY = 'cmci_user';

export const useAuthStore = defineStore('auth', () => {
  // État initialisé depuis sessionStorage → la session survit au rechargement
  const token = ref(sessionStorage.getItem(TOKEN_KEY));
  const utilisateur = ref(JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'));

  // Si un token était déjà stocké, on rétablit l'entête d'autorisation d'Axios
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  }

  // Propriétés calculées d'authentification et de rôle
  const isAuthenticated = computed(() => !!token.value);
  const role = computed(() => utilisateur.value?.role || '');

  // Helpers de rôle — utilisés dans les vues pour conditionner l'UI
  const estDisciple     = computed(() => role.value === 'Disciple');
  const estDirigeant    = computed(() => role.value === 'Dirigeant');
  const estRespContenus = computed(() => role.value === 'RespContenus');
  const estLeader       = computed(() => ['LeaderNat', 'LeaderReg', 'LeaderMon'].includes(role.value));
  const estLeaderMon    = computed(() => role.value === 'LeaderMon');

  // Enregistrer le token et l'utilisateur après connexion (+ persistance locale)
  function setSession(newToken, newUtilisateur) {
    token.value = newToken;
    utilisateur.value = newUtilisateur;
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    sessionStorage.setItem(TOKEN_KEY, newToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(newUtilisateur));
  }

  // Effacer la session lors de la déconnexion (mémoire + sessionStorage)
  function clearSession() {
    token.value = null;
    utilisateur.value = null;
    delete api.defaults.headers.common['Authorization'];
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  // Remplace les infos utilisateur (après modification du profil) sans toucher au token
  function setUtilisateur(nouvelUtilisateur) {
    utilisateur.value = nouvelUtilisateur;
    sessionStorage.setItem(USER_KEY, JSON.stringify(nouvelUtilisateur));
  }

  async function login(telephone, motDePasse) {
    const { data } = await api.post('/auth/login', { telephone, motDePasse });
    setSession(data.token, data.utilisateur);
    // On recharge le profil complet (avec photo et église) juste après la connexion
    await fetchMe();
    return data;
  }

  // Recharge le profil complet du disciple connecté depuis le serveur (+ persiste)
  async function fetchMe() {
    const { data } = await api.get('/auth/me');
    setUtilisateur(data);
    return data;
  }

  function logout() {
    clearSession();
  }

  return {
    token, utilisateur, isAuthenticated, role,
    estDisciple, estDirigeant, estRespContenus, estLeader, estLeaderMon,
    login, logout, fetchMe, setUtilisateur,
  };
});
