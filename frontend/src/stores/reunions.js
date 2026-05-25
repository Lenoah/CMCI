// Store Pinia pour la gestion des réunions
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useReunionsStore = defineStore('reunions', () => {
  const reunions = ref([]);
  const reunion = ref(null);
  const loading = ref(false);
  const erreur = ref('');

  async function fetchAll(filtres = {}) {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get('/reunions', { params: filtres });
      reunions.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Erreur lors du chargement';
    } finally {
      loading.value = false;
    }
  }

  async function fetchById(id) {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get(`/reunions/${id}`);
      reunion.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Réunion introuvable';
    } finally {
      loading.value = false;
    }
  }

  async function create(donnees) {
    const { data } = await api.post('/reunions', donnees);
    reunions.value.push(data);
    return data;
  }

  async function update(id, donnees) {
    const { data } = await api.put(`/reunions/${id}`, donnees);
    return data;
  }

  async function enregistrerPresences(id, presences) {
    const { data } = await api.post(`/reunions/${id}/presences`, { presences });
    return data;
  }

  return { reunions, reunion, loading, erreur, fetchAll, fetchById, create, update, enregistrerPresences };
});
