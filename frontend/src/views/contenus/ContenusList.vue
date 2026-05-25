<template>
  <!-- Liste des contenus spirituels (messages des 3B) -->
  <div>
    <div class="page-header">
      <h2 class="page-titre">Contenus spirituels</h2>
      <!-- Publication : RespContenus uniquement -->
      <router-link
        v-if="auth.estRespContenus"
        to="/app/contenus/nouveau"
        class="btn-primary"
      >
        + Nouveau contenu
      </router-link>
    </div>

    <LoadingSpinner v-if="store.loading" />
    <AlertMessage :message="store.erreur" type="erreur" />
    <AlertMessage :message="msgSucces" type="succes" />

    <div class="grille-contenus" v-if="!store.loading">
      <div v-if="store.contenus.length === 0" class="vide">Aucun contenu publié.</div>
      <div v-for="c in store.contenus" :key="c.idContenu" class="contenu-carte">
        <div class="contenu-header">
          <h3 class="contenu-titre">{{ c.titreContenu }}</h3>
          <span class="langue-badge">{{ c.langueOriginale }}</span>
        </div>
        <p class="contenu-publieur">
          Publié par {{ c.publieur?.prenom }} {{ c.publieur?.nom }}
          — {{ formatDate(c.datePublication) }}
        </p>
        <div class="contenu-actions">
          <router-link :to="`/app/contenus/${c.idContenu}`" class="btn-sm btn-voir">Lire</router-link>
          <button @click="marquerConsulte(c.idContenu)" class="btn-sm btn-consulte">✓ Consulté</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useContenusStore } from '@/stores/contenus';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const store = useContenusStore();
const auth = useAuthStore();
const msgSucces = ref('');

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
}

async function marquerConsulte(id) {
  try {
    await store.consulter(id);
    msgSucces.value = 'Contenu marqué comme consulté.';
    setTimeout(() => (msgSucces.value = ''), 3000);
  } catch { /* déjà consulté ou erreur */ }
}

onMounted(() => store.fetchAll());
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-primary { background: var(--primary); color: var(--text-white); padding: 0.55rem 1rem; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 600; text-decoration: none; }
.grille-contenus { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
.contenu-carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.25rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 0.5rem; }
.contenu-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.contenu-titre { font-size: 0.95rem; font-weight: 600; color: var(--primary); margin: 0; flex: 1; }
.langue-badge { background: #f0fdf4; color: #166534; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; white-space: nowrap; }
.contenu-publieur { font-size: 0.78rem; color: var(--text-light); margin: 0; }
.contenu-actions { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
.btn-sm { padding: 0.3rem 0.7rem; border-radius: var(--radius-sm); font-size: 0.8rem; cursor: pointer; border: none; font-weight: 500; text-decoration: none; }
.btn-voir { background: #eff6ff; color: #1d4ed8; }
.btn-consulte { background: #f0fdf4; color: #166534; }
.vide { color: var(--text-light); text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--radius-lg); }
</style>
