<template>
  <!-- Formulaire pour publier un nouveau contenu spirituel -->
  <div>
    <div class="page-header">
      <router-link to="/app/contenus" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">Nouveau contenu spirituel</h2>
    </div>

    <div class="carte">
      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-group">
          <label>Titre *</label>
          <input v-model="form.titreContenu" type="text" required placeholder="Titre du message ou enseignement" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Langue originale *</label>
            <input v-model="form.langueOriginale" type="text" required placeholder="Français" />
          </div>
          <div class="form-group">
            <label>Date de publication</label>
            <input v-model="form.datePublication" type="date" />
          </div>
        </div>
        <div class="form-group">
          <label>URL du fichier (optionnel)</label>
          <input v-model="form.fichierUrl" type="url" placeholder="https://..." />
        </div>

        <div class="form-actions">
          <router-link to="/app/contenus" class="btn-annuler">Annuler</router-link>
          <button type="submit" :disabled="loading" class="btn-sauvegarder">
            {{ loading ? 'Publication...' : 'Publier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useContenusStore } from '@/stores/contenus';
import AlertMessage from '@/components/common/AlertMessage.vue';

const router = useRouter();
const store = useContenusStore();
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

const form = reactive({
  titreContenu: '',
  langueOriginale: 'Français',
  datePublication: new Date().toISOString().slice(0, 10),
  fichierUrl: '',
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    await store.create(form);
    succes.value = 'Contenu publié avec succès.';
    setTimeout(() => router.push('/app/contenus'), 1500);
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de la publication.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 600px; }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus { border-color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
</style>
