<template>
  <!-- Liste des églises de maison -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Églises de maison</h2>
      <!-- Création d'une église : Leader uniquement -->
      <router-link
        v-if="auth.estLeaderMon"
        to="/app/eglises/nouvelle"
        class="btn-primary"
      >
        + Nouvelle église
      </router-link>
    </div>

    <AlertMessage :message="store.erreur" type="erreur" />
    <LoadingSpinner v-if="store.loading" />

    <DataTable
      v-else
      :colonnes="colonnes"
      :donnees="eglisesFormatees"
      cle-id="idEglise"
    >
      <template #actions_ligne="{ ligne }">
        <div class="actions-ligne">
          <router-link :to="`/app/eglises/${ligne.idEglise}`" class="btn-sm btn-voir">Voir</router-link>
          <!-- Édition / suppression : Leaders uniquement -->
          <router-link
            v-if="auth.estLeaderMon"
            :to="`/app/eglises/${ligne.idEglise}/modifier`"
            class="btn-sm btn-edit"
          >Éditer</router-link>
          <button
            v-if="auth.estLeaderMon"
            @click="confirmerSuppression(ligne)"
            class="btn-sm btn-del"
          >Suppr.</button>
        </div>
      </template>
    </DataTable>

    <ConfirmModal
      :visible="modalVisible"
      titre="Supprimer l'église"
      :message="`Supprimer ${egliseASupprimer?.nomEglise} ?`"
      @confirmer="supprimer"
      @annuler="modalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEglisesStore } from '@/stores/eglises';
import { useAuthStore } from '@/stores/auth';
import DataTable from '@/components/common/DataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const store = useEglisesStore();
const auth = useAuthStore();
const modalVisible = ref(false);
const egliseASupprimer = ref(null);

const colonnes = [
  { cle: 'nomEglise', label: 'Nom' },
  { cle: 'ville', label: 'Ville' },
  { cle: 'pays', label: 'Pays' },
  { cle: 'dirigeantNom', label: 'Dirigeant' },
  { cle: 'capaciteMax', label: 'Capacité' },
  { cle: 'statutEglise', label: 'Statut' },
];

// Aplatir les données pour le tableau
const eglisesFormatees = computed(() =>
  store.eglises.map((e) => ({
    ...e,
    dirigeantNom: e.dirigeant ? `${e.dirigeant.prenom} ${e.dirigeant.nom}` : '—',
  }))
);

function confirmerSuppression(e) {
  egliseASupprimer.value = e;
  modalVisible.value = true;
}
async function supprimer() {
  await store.remove(egliseASupprimer.value.idEglise);
  modalVisible.value = false;
}

onMounted(() => store.fetchAll());
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-primary { background: var(--primary); color: var(--text-white); padding: 0.55rem 1rem; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; text-decoration: none; }
.actions-ligne { display: flex; gap: 0.4rem; }
.btn-sm { padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.78rem; cursor: pointer; border: none; font-weight: 500; text-decoration: none; }
.btn-voir { background: #eff6ff; color: #1d4ed8; }
.btn-edit { background: #fef9c3; color: #854d0e; }
.btn-del  { background: #fef2f2; color: #991b1b; }
</style>
