<template>
  <!-- Liste des validations d'avancement, filtrée selon le rôle de l'utilisateur -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Avancements</h2>
      <!-- Seul le dirigeant peut initier une demande -->
      <router-link
        v-if="role === 'Dirigeant'"
        to="/app/validations/nouvelle"
        class="btn-primary"
      >
        + Nouvelle demande
      </router-link>
    </div>

    <AlertMessage :message="store.erreur" type="erreur" />
    <LoadingSpinner v-if="store.loading" />

    <div v-else>
      <div v-if="store.validations.length === 0" class="vide-message">
        Aucune demande d'avancement pour l'instant.
      </div>

      <div v-for="v in store.validations" :key="v.idValidation" class="validation-carte">
        <div class="validation-header">
          <div class="disciple-info">
            <span class="disciple-nom">{{ v.disciple?.prenom }} {{ v.disciple?.nom }}</span>
            <span class="niveau-badge">Niveau {{ v.niveauDemande }}</span>
          </div>
          <span :class="`statut-final statut-${v.statutFinal?.toLowerCase()}`">
            {{ v.statutFinal }}
          </span>
        </div>

        <div class="etapes">
          <!-- Étape 1 : évaluation du dirigeant -->
          <div class="etape">
            <span class="etape-label">Dirigeant :</span>
            <span :class="`etape-statut statut-${v.statutDirigeant?.toLowerCase()}`">
              {{ v.statutDirigeant }}
            </span>
          </div>
          <!-- Étape 2 : validation du leader -->
          <div class="etape">
            <span class="etape-label">Leader :</span>
            <span :class="`etape-statut statut-${v.statutLeader?.toLowerCase()}`">
              {{ v.statutLeader }}
            </span>
          </div>
        </div>

        <div class="validation-actions">
          <router-link :to="`/app/validations/${v.idValidation}`" class="btn-sm btn-voir">
            Détail
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useValidationsStore } from '@/stores/validations';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const store = useValidationsStore();
const auth = useAuthStore();
const role = computed(() => auth.utilisateur?.role || '');

onMounted(() => store.fetchAll());
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-primary { background: var(--primary); color: var(--text-white); padding: 0.55rem 1rem; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; text-decoration: none; }
.vide-message { text-align: center; padding: 3rem; color: var(--text-light); background: var(--bg-card); border-radius: var(--radius-lg); }
.validation-carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 0.75rem; box-shadow: var(--shadow-sm); }
.validation-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.disciple-info { display: flex; align-items: center; gap: 0.6rem; }
.disciple-nom { font-weight: 600; color: var(--primary); }
.niveau-badge { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.78rem; }
.statut-final { font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.7rem; border-radius: 20px; }
.etapes { display: flex; gap: 1.5rem; margin-bottom: 0.75rem; }
.etape { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; }
.etape-label { color: var(--text-secondary); }
.etape-statut { font-size: 0.78rem; font-weight: 600; }
.statut-enattente { color: #854d0e; background: #fff7ed; padding: 0.1rem 0.45rem; border-radius: 4px; }
.statut-approuve { color: #166534; background: #f0fdf4; padding: 0.1rem 0.45rem; border-radius: 4px; }
.statut-rejete { color: #991b1b; background: #fef2f2; padding: 0.1rem 0.45rem; border-radius: 4px; }
.validation-actions { display: flex; gap: 0.4rem; }
.btn-sm { padding: 0.25rem 0.7rem; border-radius: var(--radius-sm); font-size: 0.8rem; text-decoration: none; font-weight: 500; }
.btn-voir { background: #eff6ff; color: #1d4ed8; }
</style>
