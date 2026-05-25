// Store Pinia pour les routines spirituelles du disciple connecté
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useRoutinesStore = defineStore('routines', () => {
  const routines = ref([]);
  const loading = ref(false);
  const erreur = ref('');

  async function fetchAll() {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get('/routines');
      routines.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Erreur lors du chargement';
    } finally {
      loading.value = false;
    }
  }

  async function create(donnees) {
    const { data } = await api.post('/routines', donnees);
    routines.value.unshift(data); // ajouter en tête de liste
    return data;
  }

  async function update(id, donnees) {
    const { data } = await api.put(`/routines/${id}`, donnees);
    const index = routines.value.findIndex((r) => r.idRoutine === id);
    if (index !== -1) routines.value[index] = data;
    return data;
  }

  async function remove(id) {
    await api.delete(`/routines/${id}`);
    routines.value = routines.value.filter((r) => r.idRoutine !== id);
  }

  return { routines, loading, erreur, fetchAll, create, update, remove };
});
