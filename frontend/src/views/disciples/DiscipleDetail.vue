<template>
  <!-- Fiche détaillée d'un disciple -->
  <div>
    <div class="page-header">
      <router-link to="/app/disciples" class="btn-retour">← Retour</router-link>
      <!-- Modifier : Dirigeant ou Leader (pas un simple Disciple) -->
      <router-link
        v-if="d && (auth.estDirigeant || auth.estLeader)"
        :to="`/app/disciples/${d.idDisciple}/modifier`"
        class="btn-edit"
      >Modifier</router-link>
    </div>

    <LoadingSpinner v-if="store.loading" />
    <AlertMessage :message="store.erreur" type="erreur" />

    <template v-if="d">
      <!-- Informations personnelles -->
      <div class="carte">
        <h3 class="carte-titre">{{ d.prenom }} {{ d.nom }}</h3>
        <div class="info-grille">
          <div class="info-item"><span class="label">Téléphone</span><span>{{ d.telephone }}</span></div>
          <div class="info-item"><span class="label">Pays</span><span>{{ d.pays }}</span></div>
          <div class="info-item"><span class="label">Rôle</span><span class="badge">{{ d.role }}</span></div>
          <div class="info-item"><span class="label">Niveau</span><span>{{ d.niveauFormation }}</span></div>
          <div class="info-item"><span class="label">Statut</span><span :class="`statut-${d.statut?.toLowerCase()}`">{{ d.statut }}</span></div>
          <div class="info-item"><span class="label">Église</span><span>{{ d.eglise?.nomEglise || '—' }}</span></div>
        </div>
      </div>

      <!-- Dernières routines -->
      <div class="carte">
        <h4 class="section-titre">📖 Dernières routines ({{ d.routines?.length || 0 }})</h4>
        <ul class="liste" v-if="d.routines?.length">
          <li v-for="r in d.routines" :key="r.idRoutine">
            <span class="tag">{{ r.typeRoutine }}</span>
            <span>{{ new Date(r.dateRoutine).toLocaleDateString('fr-FR') }}</span>
            <span v-if="r.dureeMinutes" class="gris">{{ r.dureeMinutes }} min</span>
          </li>
        </ul>
        <p v-else class="vide">Aucune routine enregistrée.</p>
      </div>

      <!-- Demandes d'avancement -->
      <div class="carte">
        <h4 class="section-titre">⭐ Demandes d'avancement ({{ d.demandesAvancement?.length || 0 }})</h4>
        <ul class="liste" v-if="d.demandesAvancement?.length">
          <li v-for="v in d.demandesAvancement" :key="v.idValidation">
            <span>Niveau {{ v.niveauDemande }}</span>
            <span :class="`badge-${v.statutFinal?.toLowerCase()}`">{{ v.statutFinal }}</span>
          </li>
        </ul>
        <p v-else class="vide">Aucune demande d'avancement.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDisciplesStore } from '@/stores/disciples';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const store = useDisciplesStore();
const auth = useAuthStore();
const d = computed(() => store.disciple);

onMounted(() => store.fetchById(route.params.id));
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; margin-bottom: var(--space-md); }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.btn-edit { background: var(--primary); color: var(--text-white); padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: var(--space-md); box-shadow: var(--shadow-sm); }
.carte-titre { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin: 0 0 1rem; }
.info-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
.info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.label { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; }
.badge { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.8rem; display: inline-block; }
.section-titre { font-size: 0.95rem; font-weight: 600; color: var(--primary); margin: 0 0 0.75rem; }
.liste { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.liste li { display: flex; align-items: center; gap: 0.6rem; font-size: var(--font-size-sm); color: var(--text-primary); }
.tag { background: #f0fdf4; color: #166534; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
.gris { color: var(--text-light); }
.vide { color: var(--text-light); font-size: var(--font-size-sm); }
.statut-actif { color: #166534; } .statut-inactif { color: var(--text-secondary); } .statut-suspendu { color: #991b1b; }
.badge-approuve { color: #166534; } .badge-rejete { color: #991b1b; } .badge-enattente { color: #854d0e; }
</style>
