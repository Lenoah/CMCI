<template>
  <!-- Tableau de bord du dirigeant d'église de maison -->
  <div class="dashboard">
    <h2 class="page-titre">Tableau de bord — Dirigeant</h2>

    <LoadingSpinner v-if="loading" message="Chargement..." />

    <template v-else>
      <div class="stats-grille">
        <StatCard icone="👥" :valeur="stats.totalMembres" label="Membres dans l'église" />
        <StatCard icone="📅" :valeur="stats.reunionsMois" label="Réunions ce mois" />
        <StatCard icone="⭐" :valeur="stats.avancements" label="Avancements en attente" />
        <StatCard icone="⛪" :valeur="stats.eglise?.nomEglise || '—'" label="Mon église" />
      </div>

      <div class="dashboard-grille">
        <!-- Liste des membres -->
        <div class="carte">
          <div class="carte-titre">
            <span>👥 Mes disciples</span>
            <router-link to="/app/disciples" class="lien-voir">Gérer</router-link>
          </div>
          <ul class="liste-simple" v-if="stats.membres?.length">
            <li v-for="m in stats.membres" :key="m.idDisciple">
              <span class="nom">{{ m.prenom }} {{ m.nom }}</span>
              <span class="tag">Niv. {{ m.niveauFormation }}</span>
              <span :class="['statut', `statut-${m.statut?.toLowerCase()}`]">{{ m.statut }}</span>
            </li>
          </ul>
          <p v-else class="vide">Aucun membre dans cette église.</p>
        </div>

        <!-- Réunions à venir -->
        <div class="carte">
          <div class="carte-titre">
            <span>📅 Réunions à venir</span>
            <router-link to="/app/reunions" class="lien-voir">Voir tout</router-link>
          </div>
          <ul class="liste-simple" v-if="stats.reunionsAvenir?.length">
            <li v-for="r in stats.reunionsAvenir" :key="r.idReunion">
              <span class="tag">{{ r.typeReunion }}</span>
              <span>{{ formatDateHeure(r.dateHeureDebut) }}</span>
            </li>
          </ul>
          <p v-else class="vide">Aucune réunion planifiée.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import StatCard from '@/components/common/StatCard.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const loading = ref(true);
const stats = ref({});

function formatDateHeure(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/dirigeant');
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
.liste-simple { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; max-height: 300px; overflow-y: auto; }
.liste-simple li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.nom { flex: 1; color: var(--text-primary); }
.tag { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
.statut { font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 4px; }
.statut-actif { background: #f0fdf4; color: #166534; }
.statut-inactif { background: var(--bg-page); color: var(--text-secondary); }
.vide { color: var(--text-light); font-size: var(--font-size-sm); text-align: center; padding: 1rem; }
@media (max-width: 768px) { .dashboard-grille { grid-template-columns: 1fr; } }
</style>
