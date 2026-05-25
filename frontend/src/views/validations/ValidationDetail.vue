<template>
  <!-- Détail d'une validation d'avancement : permet au dirigeant et au leader d'agir -->
  <div>
    <div class="page-header">
      <router-link to="/app/validations" class="btn-retour">← Retour</router-link>
    </div>

    <LoadingSpinner v-if="loading" />
    <AlertMessage :message="erreur" type="erreur" />
    <AlertMessage :message="succes" type="succes" />

    <div class="carte" v-if="validation">
      <h3 class="carte-titre">Demande d'avancement</h3>
      <div class="info-grille">
        <div class="info-item">
          <span class="label">Disciple</span>
          <span>{{ validation.disciple?.prenom }} {{ validation.disciple?.nom }}</span>
        </div>
        <div class="info-item">
          <span class="label">Niveau demandé</span>
          <span class="niveau-badge">{{ validation.niveauDemande }}</span>
        </div>
        <div class="info-item">
          <span class="label">Évaluateur</span>
          <span>{{ validation.evaluateur?.prenom }} {{ validation.evaluateur?.nom }}</span>
        </div>
        <div class="info-item">
          <span class="label">Statut final</span>
          <span :class="`badge-${validation.statutFinal?.toLowerCase()}`">{{ validation.statutFinal }}</span>
        </div>
      </div>

      <!-- Progression en deux étapes -->
      <div class="etapes-detail">
        <div class="etape-detail" :class="etapeClasse(validation.statutDirigeant)">
          <div class="etape-num">1</div>
          <div class="etape-corps">
            <div class="etape-titre">Évaluation du dirigeant</div>
            <div :class="`badge-${validation.statutDirigeant?.toLowerCase()}`">{{ validation.statutDirigeant }}</div>
          </div>
        </div>
        <div class="etape-fleche">→</div>
        <div class="etape-detail" :class="etapeClasse(validation.statutLeader)">
          <div class="etape-num">2</div>
          <div class="etape-corps">
            <div class="etape-titre">Validation du leader</div>
            <div :class="`badge-${validation.statutLeader?.toLowerCase()}`">{{ validation.statutLeader }}</div>
          </div>
        </div>
      </div>

      <!-- Actions : le dirigeant évalue -->
      <div class="actions-section" v-if="role === 'Dirigeant' && validation.statutDirigeant === 'EnAttente'">
        <h4>Votre évaluation :</h4>
        <div class="btn-groupe">
          <button @click="evaluer('Approuve')" class="btn-approuver">✓ Approuver</button>
          <button @click="evaluer('Rejete')" class="btn-rejeter">✗ Rejeter</button>
        </div>
      </div>

      <!-- Actions : le leader valide -->
      <div class="actions-section" v-if="estLeader && validation.statutDirigeant === 'Approuve' && validation.statutLeader === 'EnAttente'">
        <h4>Votre validation finale :</h4>
        <div class="btn-groupe">
          <button @click="valider('Approuve')" class="btn-approuver">✓ Valider l'avancement</button>
          <button @click="valider('Rejete')" class="btn-rejeter">✗ Rejeter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useValidationsStore } from '@/stores/validations';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const store = useValidationsStore();
const auth = useAuthStore();

const validation = ref(null);
const loading = ref(true);
const erreur = ref('');
const succes = ref('');

const role = computed(() => auth.utilisateur?.role || '');
const estLeader = computed(() => ['LeaderNat', 'LeaderReg', 'LeaderMon'].includes(role.value));

// Classe CSS selon le statut d'une étape
function etapeClasse(statut) {
  if (statut === 'Approuve') return 'etape-approuve';
  if (statut === 'Rejete') return 'etape-rejete';
  return 'etape-attente';
}

async function evaluer(decision) {
  try {
    const { data } = await api.put(`/validations/${route.params.id}/evaluer`, { decision });
    validation.value = data;
    succes.value = `Décision "${decision}" enregistrée.`;
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur.';
  }
}

async function valider(decision) {
  try {
    const { data } = await api.put(`/validations/${route.params.id}/valider`, { decision });
    validation.value = data;
    succes.value = decision === 'Approuve' ? 'Avancement validé ! Le niveau du disciple a été mis à jour.' : 'Demande rejetée.';
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur.';
  }
}

onMounted(async () => {
  try {
    await store.fetchAll();
    validation.value = store.validations.find((v) => v.idValidation === Number(route.params.id));
    if (!validation.value) {
      const { data } = await api.get(`/validations`);
      validation.value = data.find((v) => v.idValidation === Number(route.params.id));
    }
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-header { margin-bottom: var(--space-md); }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); }
.carte-titre { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin: 0 0 1.25rem; }
.info-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
.info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.label { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; }
.niveau-badge { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.85rem; display: inline-block; }
.etapes-detail { display: flex; align-items: center; gap: 1rem; padding: 1rem 0; margin-bottom: 1.5rem; }
.etape-detail { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); flex: 1; border: 2px solid; }
.etape-attente { border-color: var(--border); background: var(--bg-page); }
.etape-approuve { border-color: #bbf7d0; background: #f0fdf4; }
.etape-rejete { border-color: #fecaca; background: #fef2f2; }
.etape-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: var(--text-white); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
.etape-titre { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.2rem; }
.etape-fleche { font-size: 1.2rem; color: var(--text-light); }
.badge-enattente { color: #854d0e; font-size: 0.78rem; }
.badge-approuve { color: #166534; font-size: 0.78rem; }
.badge-rejete { color: #991b1b; font-size: 0.78rem; }
.actions-section { padding-top: 1.25rem; border-top: 1px solid var(--border); }
.actions-section h4 { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin: 0 0 0.75rem; }
.btn-groupe { display: flex; gap: 0.75rem; }
.btn-approuver { padding: 0.55rem 1.25rem; background: var(--success); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
.btn-rejeter { padding: 0.55rem 1.25rem; background: var(--danger); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
</style>
