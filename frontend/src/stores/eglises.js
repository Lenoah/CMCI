// Store Pinia pour la gestion des églises de maison
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useEglisesStore = defineStore('eglises', () => {
  const eglises = ref([]);
  const eglise = ref(null);
  const loading = ref(false);
  const erreur = ref('');

  async function fetchAll(filtres = {}) {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get('/eglises', { params: filtres });
      eglises.value = data;
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
      const { data } = await api.get(`/eglises/${id}`);
      eglise.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Église introuvable';
    } finally {
      loading.value = false;
    }
  }

  async function create(donnees) {
    const { data } = await api.post('/eglises', donnees);
    eglises.value.push(data);
    return data;
  }

  async function update(id, donnees) {
    const { data } = await api.put(`/eglises/${id}`, donnees);
    return data;
  }

  async function remove(id) {
    await api.delete(`/eglises/${id}`);
    eglises.value = eglises.value.filter((e) => e.idEglise !== id);
  }

  return { eglises, eglise, loading, erreur, fetchAll, fetchById, create, update, remove };
});
