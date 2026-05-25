<template>
  <!-- Liste des routines spirituelles du disciple connecté -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Mes routines spirituelles</h2>
      <router-link to="/app/routines/nouvelle" class="btn-primary">+ Nouvelle routine</router-link>
    </div>

    <LoadingSpinner v-if="store.loading" />
    <AlertMessage :message="store.erreur" type="erreur" />
    <AlertMessage :message="msgSucces" type="succes" />

    <div class="cartes-routines" v-if="!store.loading">
      <div v-if="store.routines.length === 0" class="vide-message">
        Aucune routine enregistrée. Commencez dès maintenant !
      </div>
      <div v-for="r in store.routines" :key="r.idRoutine" class="routine-carte">
        <div class="routine-header">
          <span :class="`type-badge type-${r.typeRoutine?.toLowerCase()}`">{{ r.typeRoutine }}</span>
          <span class="routine-date">{{ formatDate(r.dateRoutine) }}</span>
        </div>
        <p v-if="r.notes" class="routine-notes">{{ r.notes }}</p>
        <div class="routine-footer">
          <span v-if="r.dureeMinutes" class="duree">⏱ {{ r.dureeMinutes }} min</span>
          <div class="routine-actions">
            <router-link :to="`/app/routines/${r.idRoutine}/modifier`" class="btn-sm btn-edit">Modifier</router-link>
            <button @click="confirmerSuppression(r)" class="btn-sm btn-del">Supprimer</button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :visible="modalVisible"
      titre="Supprimer la routine"
      message="Supprimer cette routine spirituelle ?"
      @confirmer="supprimer"
      @annuler="modalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoutinesStore } from '@/stores/routines';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const store = useRoutinesStore();
const modalVisible = ref(false);
const routineASupprimer = ref(null);
const msgSucces = ref('');

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function confirmerSuppression(r) {
  routineASupprimer.value = r;
  modalVisible.value = true;
}

async function supprimer() {
  await store.remove(routineASupprimer.value.idRoutine);
  msgSucces.value = 'Routine supprimée.';
  modalVisible.value = false;
  setTimeout(() => (msgSucces.value = ''), 3000);
}

onMounted(() => store.fetchAll());
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-primary { background: var(--primary); color: var(--text-white); padding: 0.55rem 1rem; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; text-decoration: none; }
.cartes-routines { display: flex; flex-direction: column; gap: 0.75rem; }
.routine-carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.1rem 1.25rem; box-shadow: var(--shadow-sm); }
.routine-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
.type-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.78rem; font-weight: 600; }
.type-lecture { background: #eff6ff; color: #1d4ed8; }
.type-meditation { background: #faf5ff; color: #6d28d9; }
.type-priereseule { background: #f0fdf4; color: #166534; }
.type-prierecollective { background: #ecfdf5; color: #065f46; }
.type-jeune { background: #fff7ed; color: #9a3412; }
.routine-date { font-size: 0.82rem; color: var(--text-secondary); }
.routine-notes { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0.3rem 0; }
.routine-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem; }
.duree { font-size: 0.8rem; color: var(--text-light); }
.routine-actions { display: flex; gap: 0.4rem; }
.btn-sm { padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.78rem; cursor: pointer; border: none; font-weight: 500; text-decoration: none; }
.btn-edit { background: #fef9c3; color: #854d0e; }
.btn-del { background: #fef2f2; color: #991b1b; }
.vide-message { text-align: center; padding: 3rem; color: var(--text-light); background: var(--bg-card); border-radius: var(--radius-lg); }
</style>
