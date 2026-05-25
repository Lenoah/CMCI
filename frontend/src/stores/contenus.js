// Store Pinia pour les contenus spirituels
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useContenusStore = defineStore('contenus', () => {
  const contenus = ref([]);
  const contenu = ref(null);
  const loading = ref(false);
  const erreur = ref('');

  async function fetchAll() {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get('/contenus');
      contenus.value = data;
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
      const { data } = await api.get(`/contenus/${id}`);
      contenu.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Contenu introuvable';
    } finally {
      loading.value = false;
    }
  }

  async function create(donnees) {
    const { data } = await api.post('/contenus', donnees);
    contenus.value.unshift(data);
    return data;
  }

  async function update(id, donnees) {
    const { data } = await api.put(`/contenus/${id}`, donnees);
    return data;
  }

  async function consulter(id) {
    const { data } = await api.post(`/contenus/${id}/consulter`);
    return data;
  }

  return { contenus, contenu, loading, erreur, fetchAll, fetchById, create, update, consulter };
});
