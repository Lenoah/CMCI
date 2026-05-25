<template>
  <!-- Page pour enregistrer les présences à une réunion -->
  <div>
    <div class="page-header">
      <router-link :to="`/app/reunions/${route.params.id}`" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">Feuille de présence</h2>
    </div>

    <LoadingSpinner v-if="chargement" />
    <AlertMessage :message="erreur" type="erreur" />
    <AlertMessage :message="succes" type="succes" />

    <div class="carte" v-if="reunion">
      <p class="info-reunion">
        <strong>{{ reunion.typeReunion }}</strong> —
        {{ new Date(reunion.dateHeureDebut).toLocaleString('fr-FR') }}
      </p>

      <p class="aide">Cochez les disciples présents à cette réunion :</p>

      <ul class="liste-presences">
        <li v-for="membre in membres" :key="membre.idDisciple">
          <label class="presence-label">
            <input type="checkbox" v-model="presencesMap[membre.idDisciple]" />
            <span>{{ membre.prenom }} {{ membre.nom }}</span>
          </label>
        </li>
        <li v-if="!membres.length" class="vide">Aucun membre dans cette église.</li>
      </ul>

      <div class="form-actions">
        <button @click="enregistrer" :disabled="loading" class="btn-sauvegarder">
          {{ loading ? 'Enregistrement...' : 'Enregistrer les présences' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useReunionsStore } from '@/stores/reunions';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const store = useReunionsStore();

const reunion = ref(null);
const membres = ref([]);
const presencesMap = reactive({}); // { idDisciple: true/false }
const chargement = ref(true);
const loading = ref(false);
const erreur = ref('');
const succes = ref('');

onMounted(async () => {
  // Charger la réunion avec ses participants existants
  await store.fetchById(route.params.id);
  reunion.value = store.reunion;

  if (reunion.value?.eglise?.idEglise) {
    // Charger tous les membres de l'église
    const { data } = await api.get('/disciples', { params: { eglise_id: reunion.value.idEglise } });
    membres.value = data;
  } else {
    // Fallback : utiliser les participants déjà enregistrés
    membres.value = reunion.value?.participants || [];
  }

  // Pré-cocher les présences déjà enregistrées
  reunion.value?.participants?.forEach((p) => {
    presencesMap[p.idDisciple] = p.Presence?.present || false;
  });
  membres.value.forEach((m) => {
    if (presencesMap[m.idDisciple] === undefined) presencesMap[m.idDisciple] = false;
  });

  chargement.value = false;
});

async function enregistrer() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    const presences = membres.value.map((m) => ({
      idDisciple: m.idDisciple,
      present: presencesMap[m.idDisciple] === true,
    }));
    await store.enregistrerPresences(route.params.id, presences);
    succes.value = 'Présences enregistrées avec succès !';
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 500px; }
.info-reunion { color: var(--text-primary); margin-bottom: 0.5rem; }
.aide { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-md); }
.liste-presences { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.5rem; }
.presence-label { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; cursor: pointer; color: var(--text-primary); }
.presence-label input { width: 16px; height: 16px; cursor: pointer; }
.vide { color: var(--text-light); font-size: var(--font-size-sm); text-align: center; }
.form-actions { display: flex; justify-content: flex-end; }
.btn-sauvegarder { padding: 0.6rem 1.25rem; background: var(--success); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
.btn-sauvegarder:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
