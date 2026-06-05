<template>
  <!-- Détail d'un contenu spirituel avec ses traductions -->
  <div>
    <div class="page-header">
      <router-link to="/app/contenus" class="btn-retour">← Retour</router-link>
      <div class="header-actions" v-if="c">
        <!-- Ajout d'une traduction : RespContenus uniquement -->
        <router-link
          v-if="auth.estRespContenus"
          :to="`/app/contenus/${c.idContenu}/traduction`"
          class="btn-traduction"
        >
          + Traduction
        </router-link>
        <!-- Suppression du contenu : RespContenus uniquement, avec confirmation -->
        <button
          v-if="auth.estRespContenus"
          @click="modalVisible = true"
          class="btn-supprimer"
        >
          Supprimer
        </button>
      </div>
    </div>

    <!-- Modale de confirmation avant suppression -->
    <ConfirmModal
      :visible="modalVisible"
      titre="Supprimer le contenu"
      :message="`Supprimer « ${c?.titreContenu} » ? Cette action est irréversible.`"
      @confirmer="supprimer"
      @annuler="modalVisible = false"
    />

    <LoadingSpinner v-if="store.loading" />

    <template v-if="c">
      <div class="carte">
        <h2 class="titre-contenu">{{ c.titreContenu }}</h2>
        <div class="meta">
          <span class="langue-badge">{{ c.langueOriginale }}</span>
          <span class="publieur">Par {{ c.publieur?.prenom }} {{ c.publieur?.nom }}</span>
          <span class="date">{{ formatDate(c.datePublication) }}</span>
        </div>

        <div v-if="c.fichierUrl" class="fichier-section">
          <a :href="c.fichierUrl" target="_blank" class="btn-fichier">📎 Ouvrir le fichier</a>
        </div>

        <button @click="marquerConsulte" class="btn-consulte">✓ Marquer comme consulté</button>
      </div>

      <!-- Traductions disponibles -->
      <div class="carte">
        <h3 class="section-titre">🌍 Traductions ({{ c.traductions?.length || 0 }})</h3>
        <ul class="liste-traductions" v-if="c.traductions?.length">
          <li v-for="t in c.traductions" :key="t.idTraduction">
            <div class="traduction-info">
              <span class="langue-badge">{{ t.langueCible }}</span>
              <span>{{ t.titreTraduit }}</span>
            </div>
            <span class="traducteur">Par {{ t.traducteur?.prenom }} {{ t.traducteur?.nom }}</span>
          </li>
        </ul>
        <p v-else class="vide">
          Aucune traduction disponible.
          <router-link
            v-if="auth.estRespContenus"
            :to="`/app/contenus/${c.idContenu}/traduction`"
          >Ajouter une traduction</router-link>
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContenusStore } from '@/stores/contenus';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ConfirmModal from '@/components/common/ConfirmModal.vue';

const route = useRoute();
const router = useRouter();
const store = useContenusStore();
const auth = useAuthStore();
const c = computed(() => store.contenu);
const modalVisible = ref(false);

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : '';
}

async function marquerConsulte() {
  await store.consulter(route.params.id);
}

// Supprimer le contenu puis revenir à la liste
async function supprimer() {
  await store.remove(route.params.id);
  modalVisible.value = false;
  router.push('/app/contenus');
}

onMounted(() => store.fetchById(route.params.id));
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.header-actions { display: flex; gap: 0.5rem; }
.btn-traduction { background: var(--primary); color: var(--text-white); padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; }
.btn-supprimer { background: transparent; color: var(--danger); border: 1px solid var(--danger); padding: 0.4rem 0.9rem; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; }
.btn-supprimer:hover { background: var(--danger); color: var(--text-white); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: var(--space-md); box-shadow: var(--shadow-sm); }
.titre-contenu { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0 0 0.75rem; }
.meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: var(--space-md); }
.langue-badge { background: #f0fdf4; color: #166534; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.78rem; }
.publieur, .date { font-size: 0.82rem; color: var(--text-secondary); }
.fichier-section { margin-bottom: var(--space-md); }
.btn-fichier { color: #1d4ed8; font-size: var(--font-size-sm); }
.btn-consulte { background: var(--success); color: var(--text-white); border: none; padding: 0.5rem 1rem; border-radius: var(--radius-sm); font-size: var(--font-size-sm); cursor: pointer; }
.section-titre { font-size: 1rem; font-weight: 600; color: var(--primary); margin: 0 0 1rem; }
.liste-traductions { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
.liste-traductions li { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
.traduction-info { display: flex; align-items: center; gap: 0.6rem; font-size: var(--font-size-sm); }
.traducteur { font-size: 0.78rem; color: var(--text-secondary); }
.vide { font-size: var(--font-size-sm); color: var(--text-light); }
.vide a { color: #1d4ed8; }
</style>
