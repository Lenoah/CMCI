<template>
  <!-- Suivi des routines des disciples sous la responsabilité du compte connecté.
       Lecture seule : un responsable consulte mais ne modifie pas. -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Suivi des routines</h2>
    </div>
    <p class="fil-ariane">Routines des disciples de votre périmètre (lecture seule)</p>

    <AlertMessage :message="store.erreur" type="erreur" />
    <LoadingSpinner v-if="store.loading" />

    <DataTable
      v-else
      :colonnes="colonnes"
      :donnees="lignes"
      cle-id="idRoutine"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoutinesStore } from '@/stores/routines';
import DataTable from '@/components/common/DataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const store = useRoutinesStore();

const colonnes = [
  { cle: 'discipleNom', label: 'Disciple' },
  { cle: 'typeRoutine', label: 'Type' },
  { cle: 'dateAff', label: 'Date' },
  { cle: 'dureeAff', label: 'Durée' },
  { cle: 'notes', label: 'Notes' },
];

// Aplatir les routines pour le tableau (nom du disciple + valeurs lisibles)
const lignes = computed(() =>
  store.suivi.map((r) => ({
    idRoutine: r.idRoutine,
    discipleNom: r.disciple ? `${r.disciple.prenom} ${r.disciple.nom}` : '—',
    typeRoutine: r.typeRoutine,
    dateAff: new Date(r.dateRoutine).toLocaleDateString('fr-FR'),
    dureeAff: r.dureeMinutes ? `${r.dureeMinutes} min` : '—',
    notes: r.notes || '—',
  }))
);

onMounted(() => store.fetchSuivi());
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xs); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.fil-ariane { font-size: 0.8rem; color: var(--text-light); margin: 0 0 var(--space-lg); }
</style>
