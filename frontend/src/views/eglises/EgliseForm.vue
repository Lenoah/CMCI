<template>
  <!-- Formulaire pour créer ou modifier une église de maison -->
  <div>
    <div class="page-header">
      <router-link to="/app/eglises" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">{{ estModification ? 'Modifier l\'église' : 'Nouvelle église' }}</h2>
    </div>

    <div class="carte">
      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-group">
          <label>Nom de l'église *</label>
          <input v-model="form.nomEglise" type="text" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Ville</label>
            <input v-model="form.ville" type="text" />
          </div>
          <div class="form-group">
            <label>Pays</label>
            <input v-model="form.pays" type="text" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Capacité maximale</label>
            <input v-model.number="form.capaciteMax" type="number" min="1" />
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select v-model="form.statutEglise">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Fermee">Fermée</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <router-link to="/app/eglises" class="btn-annuler">Annuler</router-link>
          <button type="submit" :disabled="loading" class="btn-sauvegarder">
            {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEglisesStore } from '@/stores/eglises';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const router = useRouter();
const store = useEglisesStore();

const estModification = computed(() => !!route.params.id);
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

const form = reactive({ nomEglise: '', ville: '', pays: '', capaciteMax: 30, statutEglise: 'Active' });

onMounted(async () => {
  if (estModification.value) {
    await store.fetchById(route.params.id);
    const e = store.eglise;
    if (e) Object.assign(form, { nomEglise: e.nomEglise, ville: e.ville, pays: e.pays, capaciteMax: e.capaciteMax, statutEglise: e.statutEglise });
  }
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    if (estModification.value) {
      await store.update(route.params.id, form);
    } else {
      await store.create(form);
    }
    succes.value = 'Église enregistrée avec succès.';
    setTimeout(() => router.push('/app/eglises'), 1500);
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
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 600px; }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input, .form-group select { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
</style>
