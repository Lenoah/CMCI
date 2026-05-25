// Store Pinia pour l'authentification
// On stocke le token et l'utilisateur uniquement en mémoire (Pinia)
// Pas de localStorage — conformément aux règles du projet
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  // État : token JWT et infos de l'utilisateur connecté
  const token = ref(null);
  const utilisateur = ref(null);

  // Propriétés calculées d'authentification et de rôle
  const isAuthenticated = computed(() => !!token.value);
  const role = computed(() => utilisateur.value?.role || '');

  // Helpers de rôle — utilisés dans les vues pour conditionner l'UI
  const estDisciple     = computed(() => role.value === 'Disciple');
  const estDirigeant    = computed(() => role.value === 'Dirigeant');
  const estRespContenus = computed(() => role.value === 'RespContenus');
  const estLeader       = computed(() => ['LeaderNat', 'LeaderReg', 'LeaderMon'].includes(role.value));

  // Enregistrer le token et l'utilisateur après connexion
  function setSession(newToken, newUtilisateur) {
    token.value = newToken;
    utilisateur.value = newUtilisateur;
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  }

  // Effacer la session lors de la déconnexion
  function clearSession() {
    token.value = null;
    utilisateur.value = null;
    delete api.defaults.headers.common['Authorization'];
  }

  async function login(telephone, motDePasse) {
    const { data } = await api.post('/auth/login', { telephone, motDePasse });
    setSession(data.token, data.utilisateur);
    return data;
  }

  function logout() {
    clearSession();
  }

  return {
    token, utilisateur, isAuthenticated, role,
    estDisciple, estDirigeant, estRespContenus, estLeader,
    login, logout,
  };
});
