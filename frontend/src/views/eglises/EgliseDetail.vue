<template>
  <!-- Fiche détaillée d'une église de maison -->
  <div>
    <div class="page-header">
      <router-link to="/app/eglises" class="btn-retour">← Retour</router-link>
      <!-- Modification d'une église : Leader uniquement -->
      <router-link
        v-if="e && auth.estLeader"
        :to="`/app/eglises/${e.idEglise}/modifier`"
        class="btn-edit"
      >Modifier</router-link>
    </div>

    <LoadingSpinner v-if="store.loading" />
    <AlertMessage :message="store.erreur" type="erreur" />

    <template v-if="e">
      <div class="carte">
        <h3 class="carte-titre">{{ e.nomEglise }}</h3>
        <div class="info-grille">
          <div class="info-item"><span class="label">Ville</span><span>{{ e.ville }}</span></div>
          <div class="info-item"><span class="label">Pays</span><span>{{ e.pays }}</span></div>
          <div class="info-item"><span class="label">Capacité max</span><span>{{ e.capaciteMax }}</span></div>
          <div class="info-item"><span class="label">Statut</span><span>{{ e.statutEglise }}</span></div>
          <div class="info-item">
            <span class="label">Dirigeant</span>
            <span>{{ e.dirigeant ? `${e.dirigeant.prenom} ${e.dirigeant.nom}` : '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Membres -->
      <div class="carte">
        <h4 class="section-titre">👥 Membres ({{ e.membres?.length || 0 }})</h4>
        <ul class="liste" v-if="e.membres?.length">
          <li v-for="m in e.membres" :key="m.idDisciple">
            <router-link :to="`/app/disciples/${m.idDisciple}`">{{ m.prenom }} {{ m.nom }}</router-link>
            <span class="tag">{{ m.role }}</span>
            <span class="gris">Niv. {{ m.niveauFormation }}</span>
          </li>
        </ul>
        <p v-else class="vide">Aucun membre.</p>
      </div>

      <!-- Réunions récentes -->
      <div class="carte">
        <h4 class="section-titre">📅 Réunions ({{ e.reunions?.length || 0 }})</h4>
        <ul class="liste" v-if="e.reunions?.length">
          <li v-for="r in e.reunions" :key="r.idReunion">
            <router-link :to="`/app/reunions/${r.idReunion}`">
              {{ r.typeReunion }} — {{ new Date(r.dateHeureDebut).toLocaleDateString('fr-FR') }}
            </router-link>
            <span class="tag">{{ r.statutReunion }}</span>
          </li>
        </ul>
        <p v-else class="vide">Aucune réunion.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEglisesStore } from '@/stores/eglises';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const store = useEglisesStore();
const auth = useAuthStore();
const e = computed(() => store.eglise);

onMounted(() => store.fetchById(route.params.id));
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; margin-bottom: var(--space-md); }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.btn-edit { background: var(--primary); color: var(--text-white); padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: var(--space-md); box-shadow: var(--shadow-sm); }
.carte-titre { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin: 0 0 1rem; }
.info-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
.info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.label { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; }
.section-titre { font-size: 0.95rem; font-weight: 600; color: var(--primary); margin: 0 0 0.75rem; }
.liste { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.liste li { display: flex; align-items: center; gap: 0.6rem; font-size: var(--font-size-sm); color: var(--text-primary); }
.tag { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
.gris { color: var(--text-light); }
.vide { color: var(--text-light); font-size: var(--font-size-sm); }
</style>
