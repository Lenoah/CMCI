<template>
  <!-- Formulaire pour créer ou modifier une routine spirituelle -->
  <div>
    <div class="page-header">
      <router-link to="/app/routines" class="btn-retour">← Retour</router-link>
      <h2 class="page-titre">{{ estModification ? 'Modifier la routine' : 'Nouvelle routine' }}</h2>
    </div>

    <div class="carte">
      <AlertMessage :message="erreur" type="erreur" />
      <AlertMessage :message="succes" type="succes" />

      <form @submit.prevent="sauvegarder" class="formulaire">
        <div class="form-group">
          <label>Type de routine *</label>
          <select v-model="form.typeRoutine" required>
            <option value="Lecture">📖 Lecture biblique</option>
            <option value="Meditation">🧘 Méditation</option>
            <option value="PriereSeule">🙏 Prière seule</option>
            <option value="PriereCollective">👐 Prière collective</option>
            <option value="Jeune">⚡ Jeûne</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date *</label>
            <input v-model="form.dateRoutine" type="date" required />
          </div>
          <div class="form-group">
            <label>Durée (minutes)</label>
            <input v-model.number="form.dureeMinutes" type="number" min="1" placeholder="ex: 30" />
          </div>
        </div>
        <div class="form-group">
          <label>Notes personnelles</label>
          <textarea v-model="form.notes" rows="3" placeholder="Ce que j'ai vécu, retenu..."></textarea>
        </div>

        <div class="form-actions">
          <router-link to="/app/routines" class="btn-annuler">Annuler</router-link>
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
import { useRoutinesStore } from '@/stores/routines';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const router = useRouter();
const store = useRoutinesStore();

const estModification = computed(() => !!route.params.id);
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

const form = reactive({
  typeRoutine: 'Lecture',
  dateRoutine: new Date().toISOString().slice(0, 10), // date d'aujourd'hui par défaut
  dureeMinutes: null,
  notes: '',
});

onMounted(async () => {
  if (estModification.value) {
    await store.fetchAll();
    const r = store.routines.find((r) => r.idRoutine === Number(route.params.id));
    if (r) Object.assign(form, { typeRoutine: r.typeRoutine, dateRoutine: r.dateRoutine, dureeMinutes: r.dureeMinutes, notes: r.notes || '' });
  }
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    if (estModification.value) {
      await store.update(Number(route.params.id), form);
    } else {
      await store.create(form);
    }
    succes.value = 'Routine enregistrée avec succès.';
    setTimeout(() => router.push('/app/routines'), 1500);
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
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 550px; }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input, .form-group select, .form-group textarea { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
.btn-sauvegarder:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
