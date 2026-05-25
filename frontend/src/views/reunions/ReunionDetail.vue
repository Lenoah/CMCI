<template>
  <!-- Détail d'une réunion avec liste des participants et présences -->
  <div>
    <div class="page-header">
      <router-link to="/app/reunions" class="btn-retour">← Retour</router-link>
      <!-- Présences : seul le Dirigeant organisateur peut y accéder -->
      <router-link
        v-if="r && peutGererPresences"
        :to="`/app/reunions/${r.idReunion}/presences`"
        class="btn-presence"
      >
        Gérer les présences
      </router-link>
    </div>

    <LoadingSpinner v-if="store.loading" />
    <AlertMessage :message="store.erreur" type="erreur" />

    <template v-if="r">
      <div class="carte">
        <h3 class="carte-titre">{{ r.typeReunion }}</h3>
        <div class="info-grille">
          <div class="info-item"><span class="label">Église</span><span>{{ r.eglise?.nomEglise }}</span></div>
          <div class="info-item"><span class="label">Début</span><span>{{ formatDH(r.dateHeureDebut) }}</span></div>
          <div class="info-item"><span class="label">Fin</span><span>{{ formatDH(r.dateHeureFin) }}</span></div>
          <div class="info-item"><span class="label">Organisateur</span><span>{{ r.organisateur ? `${r.organisateur.prenom} ${r.organisateur.nom}` : '—' }}</span></div>
          <div class="info-item"><span class="label">Statut</span><span class="badge">{{ r.statutReunion }}</span></div>
        </div>
      </div>

      <!-- Participants + présences -->
      <div class="carte">
        <h4 class="section-titre">👥 Participants ({{ r.participants?.length || 0 }})</h4>
        <ul class="liste" v-if="r.participants?.length">
          <li v-for="p in r.participants" :key="p.idDisciple">
            <span class="nom">{{ p.prenom }} {{ p.nom }}</span>
            <span :class="p.Presence?.present ? 'present' : 'absent'">
              {{ p.Presence?.present ? '✓ Présent' : '✗ Absent' }}
            </span>
          </li>
        </ul>
        <p v-else class="vide">Aucun participant enregistré.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useReunionsStore } from '@/stores/reunions';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const store = useReunionsStore();
const auth = useAuthStore();
const r = computed(() => store.reunion);

// Seul le Dirigeant qui a organisé la réunion peut gérer les présences
const peutGererPresences = computed(() =>
  auth.estDirigeant && r.value?.organisateur?.idDisciple === auth.utilisateur?.idDisciple
);

function formatDH(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

onMounted(() => store.fetchById(route.params.id));
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; margin-bottom: var(--space-md); }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.btn-presence { background: var(--primary); color: var(--text-white); padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: var(--space-md); box-shadow: var(--shadow-sm); }
.carte-titre { font-size: 1.2rem; font-weight: 700; color: var(--primary); margin: 0 0 1rem; }
.info-grille { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
.info-item { display: flex; flex-direction: column; gap: 0.2rem; }
.label { font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; }
.badge { background: #eff6ff; color: #1d4ed8; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.8rem; display: inline-block; }
.section-titre { font-size: 0.95rem; font-weight: 600; color: var(--primary); margin: 0 0 0.75rem; }
.liste { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.liste li { display: flex; align-items: center; justify-content: space-between; font-size: var(--font-size-sm); padding: 0.4rem 0; border-bottom: 1px solid var(--border); }
.nom { color: var(--text-primary); }
.present { color: #166534; font-size: 0.8rem; }
.absent  { color: #991b1b; font-size: 0.8rem; }
.vide { color: var(--text-light); font-size: var(--font-size-sm); }
</style>
