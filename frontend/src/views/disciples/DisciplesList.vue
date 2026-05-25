<template>
  <!-- Liste de tous les disciples avec recherche et filtres -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Disciples</h2>
      <!-- Inscription d'un nouveau disciple : Dirigeant (dans son église) + Leaders -->
      <router-link
        v-if="auth.estDirigeant || auth.estLeader"
        to="/app/disciples/nouveau"
        class="btn-primary"
      >
        + Nouveau disciple
      </router-link>
    </div>

    <AlertMessage :message="store.erreur" type="erreur" />
    <LoadingSpinner v-if="store.loading" />

    <DataTable
      v-else
      :colonnes="colonnes"
      :donnees="store.disciples"
      cle-id="idDisciple"
    >
      <template #actions>
        <select v-model="filtreRole" @change="charger" class="filtre-select">
          <option value="">Tous les rôles</option>
          <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
        </select>
      </template>
      <template #actions_ligne="{ ligne }">
        <div class="actions-ligne">
          <router-link :to="`/app/disciples/${ligne.idDisciple}`" class="btn-sm btn-voir">Voir</router-link>
          <!-- Édition : Dirigeant et Leaders -->
          <router-link
            v-if="auth.estDirigeant || auth.estLeader"
            :to="`/app/disciples/${ligne.idDisciple}/modifier`"
            class="btn-sm btn-edit"
          >Éditer</router-link>
          <!-- Suppression : Leaders uniquement -->
          <button
            v-if="auth.estLeader"
            @click="confirmerSuppression(ligne)"
            class="btn-sm btn-del"
          >Suppr.</button>
        </div>
      </template>
    </DataTable>

    <!-- Modale de confirmation de suppression -->
    <ConfirmModal
      :visible="modalVisible"
      titre="Supprimer le disciple"
      :message="`Supprimer ${discipleASupprimer?.prenom} ${discipleASupprimer?.nom} ?`"
      @confirmer="supprimer"
      @annuler="modalVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDisciplesStore } from '@/stores/disciples';
import { useAuthStore } from '@/stores/auth';
import DataTable from '@/components/common/DataTable.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const store = useDisciplesStore();
const auth = useAuthStore();
const filtreRole = ref('');
const modalVisible = ref(false);
const discipleASupprimer = ref(null);

const roles = ['Disciple', 'Dirigeant', 'LeaderNat', 'LeaderReg', 'LeaderMon', 'RespContenus'];

// Colonnes affichées dans le tableau
const colonnes = [
  { cle: 'prenom', label: 'Prénom' },
  { cle: 'nom', label: 'Nom' },
  { cle: 'telephone', label: 'Téléphone' },
  { cle: 'pays', label: 'Pays' },
  { cle: 'role', label: 'Rôle' },
  { cle: 'niveauFormation', label: 'Niveau' },
  { cle: 'statut', label: 'Statut' },
];

function charger() {
  const filtres = filtreRole.value ? { role: filtreRole.value } : {};
  store.fetchAll(filtres);
}

function confirmerSuppression(d) {
  discipleASupprimer.value = d;
  modalVisible.value = true;
}

async function supprimer() {
  await store.remove(discipleASupprimer.value.idDisciple);
  modalVisible.value = false;
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
.btn-edit { background: #fef9c3; color: #854d0e; }
.btn-del  { background: #fef2f2; color: #991b1b; }
</style>
