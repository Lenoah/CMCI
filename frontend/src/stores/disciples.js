// Store Pinia pour la gestion des disciples
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useDisciplesStore = defineStore('disciples', () => {
  const disciples = ref([]);      // liste des disciples
  const disciple = ref(null);     // disciple sélectionné
  const loading = ref(false);
  const erreur = ref('');

  // Récupérer tous les disciples (avec filtres optionnels)
  async function fetchAll(filtres = {}) {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get('/disciples', { params: filtres });
      disciples.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Erreur lors du chargement';
    } finally {
      loading.value = false;
    }
  }

  // Récupérer un disciple par son ID
  async function fetchById(id) {
    loading.value = true;
    erreur.value = '';
    try {
      const { data } = await api.get(`/disciples/${id}`);
      disciple.value = data;
    } catch (err) {
      erreur.value = err.response?.data?.message || 'Disciple introuvable';
    } finally {
      loading.value = false;
    }
  }

  // Créer un disciple (réservé au Dirigeant)
  // Le serveur force le rôle 'Disciple' et le rattachement à l'église du dirigeant
  async function create(donnees) {
    const { data } = await api.post('/disciples', donnees);
    return data;
  }

  // Modifier un disciple
  async function update(id, donnees) {
    const { data } = await api.put(`/disciples/${id}`, donnees);
    return data;
  }

  // Supprimer un disciple
  async function remove(id) {
    await api.delete(`/disciples/${id}`);
    disciples.value = disciples.value.filter((d) => d.idDisciple !== id);
  }

  return { disciples, disciple, loading, erreur, fetchAll, fetchById, create, update, remove };
});
