<template>
  <!-- Formulaire pour créer une réunion -->
  <div>
    <div class="page-header">
      <router-link to="/app/reunions" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">Nouvelle réunion</h2>
    </div>

    <div class="carte">
      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-group">
          <label>Type de réunion *</label>
          <select v-model="form.typeReunion" required>
            <option value="Priere">Prière</option>
            <option value="EtudeBiblique">Étude Biblique</option>
            <option value="Culte">Culte</option>
            <option value="Evangelisation">Évangélisation</option>
            <option value="Formation">Formation</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Début *</label>
            <input v-model="form.dateHeureDebut" type="datetime-local" required />
          </div>
          <div class="form-group">
            <label>Fin</label>
            <input v-model="form.dateHeureFin" type="datetime-local" />
          </div>
        </div>
        <div class="form-group">
          <label>Église *</label>
          <select v-model.number="form.idEglise" required>
            <option v-for="e in eglises" :key="e.idEglise" :value="e.idEglise">
              {{ e.nomEglise }} — {{ e.ville }}
            </option>
          </select>
        </div>

        <div class="form-actions">
          <router-link to="/app/reunions" class="btn-annuler">Annuler</router-link>
          <button type="submit" :disabled="loading" class="btn-sauvegarder">
            {{ loading ? 'Enregistrement...' : 'Créer la réunion' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useReunionsStore } from '@/stores/reunions';
import api from '@/services/api';
import AlertMessage from '@/components/common/AlertMessage.vue';

const router = useRouter();
const store = useReunionsStore();
const erreur = ref('');
const succes = ref('');
const loading = ref(false);
const eglises = ref([]);

const form = reactive({ typeReunion: 'Culte', dateHeureDebut: '', dateHeureFin: '', idEglise: null });

// Charger la liste des églises pour le sélecteur
onMounted(async () => {
  const { data } = await api.get('/eglises');
  eglises.value = data;
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    await store.create(form);
    succes.value = 'Réunion créée avec succès.';
    setTimeout(() => router.push('/app/reunions'), 1500);
  } catch (err) {
    erreur.value = err.response?.data?.message || 'Erreur lors de la création.';
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
.form-group input, .form-group select { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
</style>
