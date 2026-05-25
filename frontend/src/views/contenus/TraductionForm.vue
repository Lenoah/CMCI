<template>
  <!-- Formulaire pour ajouter une traduction à un contenu spirituel -->
  <div>
    <div class="page-header">
      <router-link :to="`/app/contenus/${route.params.id}`" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">Ajouter une traduction</h2>
    </div>

    <div class="carte">
      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-group">
          <label>Langue cible *</label>
          <input v-model="form.langueCible" type="text" required placeholder="ex: Anglais, Espagnol, Lingala..." />
        </div>
        <div class="form-group">
          <label>Titre traduit</label>
          <input v-model="form.titreTraduit" type="text" placeholder="Titre dans la langue cible" />
        </div>
        <div class="form-group">
          <label>URL du fichier traduit (optionnel)</label>
          <input v-model="form.fichierUrl" type="url" placeholder="https://..." />
        </div>

        <div class="form-actions">
          <router-link :to="`/app/contenus/${route.params.id}`" class="btn-annuler">Annuler</router-link>
          <button type="submit" :disabled="loading" class="btn-sauvegarder">
            {{ loading ? 'Enregistrement...' : 'Ajouter la traduction' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const router = useRouter();
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

const form = reactive({ langueCible: '', titreTraduit: '', fichierUrl: '' });

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    await api.post('/traductions', { ...form, idContenu: Number(route.params.id) });
    succes.value = 'Traduction ajoutée avec succès.';
    setTimeout(() => router.push(`/app/contenus/${route.params.id}`), 1500);
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de l\'enregistrement.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: var(--space-lg); }
.page-titre { font-size: var(--font-size-xl); font-weight: 700; color: var(--primary); margin: 0; }
.btn-retour { color: var(--primary); font-size: var(--font-size-sm); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 500px; }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus { border-color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
</style>
