<template>
  <!-- Tableau de bord du disciple -->
  <div class="dashboard">
    <h2 class="page-titre">Bonjour, {{ utilisateur?.prenom }} !</h2>

    <!-- Chargement -->
    <LoadingSpinner v-if="loading" message="Chargement de vos statistiques..." />

    <template v-else>
      <!-- Cartes de statistiques -->
      <div class="stats-grille">
        <StatCard icone="📖" :valeur="stats.routinesSemaine" label="Routines cette semaine" />
        <StatCard icone="⭐" :valeur="stats.niveauFormation" label="Niveau de formation" />
        <StatCard icone="📚" :valeur="stats.contenusConsultes" label="Contenus consultés" />
        <StatCard icone="✝" :valeur="utilisateur?.role" label="Mon rôle" />
      </div>

      <!-- Deux colonnes : routines + réunions -->
      <div class="dashboard-grille">
        <!-- Dernières routines -->
        <div class="carte">
          <div class="carte-titre">
            <span>📖 Mes dernières routines</span>
            <router-link to="/app/routines" class="lien-voir">Voir tout</router-link>
          </div>
          <ul class="liste-simple" v-if="stats.dernieresRoutines?.length">
            <li v-for="r in stats.dernieresRoutines" :key="r.idRoutine">
              <span class="tag">{{ r.typeRoutine }}</span>
              <span>{{ formatDate(r.dateRoutine) }}</span>
              <span v-if="r.dureeMinutes" class="duree">{{ r.dureeMinutes }} min</span>
            </li>
          </ul>
          <p v-else class="vide">Aucune routine enregistrée.</p>
        </div>

        <!-- Prochaines réunions -->
        <div class="carte">
          <div class="carte-titre">
            <span>📅 Prochaines réunions</span>
            <router-link to="/app/reunions" class="lien-voir">Voir tout</router-link>
          </div>
          <ul class="liste-simple" v-if="stats.prochainesReunions?.length">
            <li v-for="r in stats.prochainesReunions" :key="r.idReunion">
              <span class="tag">{{ r.typeReunion }}</span>
              <span>{{ formatDateHeure(r.dateHeureDebut) }}</span>
              <span class="eglise">{{ r.eglise?.nomEglise }}</span>
            </li>
          </ul>
          <p v-else class="vide">Aucune réunion à venir.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import api from '@/services/api';
import StatCard from '@/components/common/StatCard.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const auth = useAuthStore();
const { utilisateur } = storeToRefs(auth);
const loading = ref(true);
const stats = ref({});

// Formater une date courte
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
}

// Formater date + heure
function formatDateHeure(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

// Charger les stats au montage du composant
onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/disciple');
    stats.value = data;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 1.5rem; }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.stats-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.dashboard-grille { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-sm); }
.carte-titre { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--primary); margin-bottom: var(--space-md); font-size: 0.9rem; }
.lien-voir { font-size: 0.8rem; color: var(--info); font-weight: 400; }
.liste-simple { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
.liste-simple li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-primary); }
.tag { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
.duree { color: var(--text-secondary); font-size: 0.8rem; margin-left: auto; }
.eglise { color: var(--text-secondary); font-size: 0.8rem; margin-left: auto; }
.vide { color: var(--text-light); font-size: var(--font-size-sm); text-align: center; padding: 1rem; }
@media (max-width: 768px) { .dashboard-grille { grid-template-columns: 1fr; } }
</style>
