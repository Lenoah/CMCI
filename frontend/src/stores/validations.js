// Store Pinia pour les validations d'avancement
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useValidationsStore = defineStore('validations', () => {
  const validations = ref([]);
  const validation = ref(null);
  const loading = ref(false);
  const erreur = ref('');

  async function fetchAll() {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get('/validations');
      validations.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Erreur lors du chargement';
    } finally {
      loading.value = false;
    }
  }

  async function create(donnees) {
    const { data } = await api.post('/validations', donnees);
    validations.value.unshift(data);
    return data;
  }

  // Le dirigeant approuve ou rejette
  async function evaluer(id, decision) {
    const { data } = await api.put(`/validations/${id}/evaluer`, { decision });
    return data;
  }

  // Le leader valide ou rejette en dernier
  async function valider(id, decision) {
    const { data } = await api.put(`/validations/${id}/valider`, { decision });
    return data;
  }

  return { validations, validation, loading, erreur, fetchAll, create, evaluer, valider };
});
