<template>
  <!-- Tableau de bord du Leader — vue globale de la zone -->
  <div class="dashboard">
    <h2 class="page-titre">Tableau de bord — Leader</h2>

    <LoadingSpinner v-if="loading" message="Chargement..." />

    <template v-else>
      <!-- 4 grandes statistiques -->
      <div class="stats-grille">
        <StatCard icone="👥" :valeur="stats.totalDisciples" label="Disciples actifs" />
        <StatCard icone="⛪" :valeur="stats.totalEglises" label="Églises actives" />
        <StatCard icone="📅" :valeur="stats.totalReunions" label="Réunions ce mois" />
        <StatCard icone="✅" :valeur="stats.avancementsAttente" label="Avancements à valider" />
      </div>

      <!-- Répartition par pays -->
      <div class="carte">
        <div class="carte-titre">🌍 Répartition des disciples par pays</div>
        <div class="pays-liste">
          <div v-for="p in stats.parPays" :key="p.pays" class="pays-ligne">
            <span class="pays-nom">{{ p.pays || 'Non défini' }}</span>
            <div class="barre-container">
              <div
                class="barre"
                :style="{ width: largeurBarre(p.total) }"
              ></div>
            </div>
            <span class="pays-total">{{ p.total }}</span>
          </div>
          <p v-if="!stats.parPays?.length" class="vide">Aucune donnée disponible.</p>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="actions-rapides">
        <router-link to="/app/validations" class="btn-action">
          ✅ Valider des avancements ({{ stats.avancementsAttente }})
        </router-link>
        <router-link to="/app/eglises" class="btn-action">
          ⛪ Voir toutes les églises
        </router-link>
        <router-link to="/app/disciples" class="btn-action">
          👥 Voir tous les disciples
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import StatCard from '@/components/common/StatCard.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const loading = ref(true);
const stats = ref({});

// Calculer la largeur de la barre de progression par pays
const maxTotal = computed(() => {
  if (!stats.value.parPays?.length) return 1;
  return Math.max(...stats.value.parPays.map((p) => Number(p.total)));
});

function largeurBarre(total) {
  const pct = (Number(total) / maxTotal.value) * 100;
  return `${Math.max(pct, 4)}%`;
}

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/leader');
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
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); }
.carte-titre { font-weight: 600; color: var(--primary); margin-bottom: var(--space-lg); }
.pays-liste { display: flex; flex-direction: column; gap: 0.75rem; }
.pays-ligne { display: grid; grid-template-columns: 140px 1fr 50px; align-items: center; gap: 0.75rem; }
.pays-nom { font-size: var(--font-size-sm); color: var(--text-primary); }
.barre-container { background: var(--bg-page); border-radius: 4px; height: 10px; }
.barre { height: 10px; background: var(--primary); border-radius: 4px; transition: width 0.5s; }
.pays-total { font-size: var(--font-size-sm); font-weight: 600; color: var(--primary); text-align: right; }
.actions-rapides { display: flex; gap: 1rem; flex-wrap: wrap; }
.btn-action { padding: 0.65rem 1.25rem; background: var(--primary); color: var(--text-white); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: var(--transition); }
.btn-action:hover { background: var(--primary-dark); text-decoration: none; }
.vide { color: var(--text-light); font-size: var(--font-size-sm); text-align: center; }
</style>
