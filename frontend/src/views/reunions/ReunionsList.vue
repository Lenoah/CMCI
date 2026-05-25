<template>
  <!-- Liste des réunions -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Réunions</h2>
      <!-- Seul un Dirigeant peut créer une réunion -->
      <router-link
        v-if="auth.estDirigeant"
        to="/app/reunions/nouvelle"
        class="btn-primary"
      >
        + Nouvelle réunion
      </router-link>
    </div>

    <AlertMessage :message="store.erreur" type="erreur" />
    <LoadingSpinner v-if="store.loading" />

    <DataTable
      v-else
      :colonnes="colonnes"
      :donnees="reunionsFormatees"
      cle-id="idReunion"
    >
      <template #actions>
        <select v-model="filtreStatut" @change="charger" class="filtre-select">
          <option value="">Tous les statuts</option>
          <option value="Planifiee">Planifiée</option>
          <option value="EnCours">En cours</option>
          <option value="Terminee">Terminée</option>
          <option value="Annulee">Annulée</option>
        </select>
      </template>
      <template #actions_ligne="{ ligne }">
        <div class="actions-ligne">
          <router-link :to="`/app/reunions/${ligne.idReunion}`" class="btn-sm btn-voir">Voir</router-link>
          <!-- Présences : seul le Dirigeant organisateur peut les enregistrer -->
          <router-link
            v-if="auth.estDirigeant && ligne.organisateur?.idDisciple === auth.utilisateur?.idDisciple"
            :to="`/app/reunions/${ligne.idReunion}/presences`"
            class="btn-sm btn-presence"
          >
            Présences
          </router-link>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useReunionsStore } from '@/stores/reunions';
import { useAuthStore } from '@/stores/auth';
import DataTable from '@/components/common/DataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const store = useReunionsStore();
const auth = useAuthStore();
const filtreStatut = ref('');

const colonnes = [
  { cle: 'typeReunion', label: 'Type' },
  { cle: 'egliseNom', label: 'Église' },
  { cle: 'dateDebut', label: 'Date et heure' },
  { cle: 'statutReunion', label: 'Statut' },
];

const reunionsFormatees = computed(() =>
  store.reunions.map((r) => ({
    ...r,
    egliseNom: r.eglise?.nomEglise || '—',
    dateDebut: r.dateHeureDebut ? new Date(r.dateHeureDebut).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—',
  }))
);

function charger() {
  const f = filtreStatut.value ? { statut: filtreStatut.value } : {};
  store.fetchAll(f);
}

onMounted(charger);
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-primary { background: var(--primary); color: var(--text-white); padding: 0.55rem 1rem; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; text-decoration: none; }
.filtre-select { padding: 0.45rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.actions-ligne { display: flex; gap: 0.4rem; }
.btn-sm { padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.78rem; cursor: pointer; border: none; font-weight: 500; text-decoration: none; }
.btn-voir { background: #eff6ff; color: #1d4ed8; }
.btn-presence { background: #f0fdf4; color: #166534; }
</style>
