<template>
  <!-- Création / modification d'une église (réservé au Leader Mondial) -->
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
            <label>Pays *</label>
            <select v-model="form.paysCode" required>
              <option value="">— Choisir un pays —</option>
              <option v-for="p in pays" :key="p.code" :value="p.code">{{ p.nom }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ville</label>
            <select v-model="form.ville" :disabled="!form.paysCode">
              <option value="">— Choisir une ville —</option>
              <option v-for="v in villes" :key="v" :value="v">{{ v }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <!-- La sous-région est déduite automatiquement du pays -->
            <label>Sous-région (déduite)</label>
            <input :value="region || '—'" type="text" disabled class="champ-lecture" />
          </div>
          <div class="form-group">
            <label>Capacité maximale</label>
            <input v-model.number="form.capaciteMax" type="number" min="1" />
          </div>
        </div>

        <div v-if="estModification" class="form-group">
          <label>Statut</label>
          <select v-model="form.statutEglise">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Fermee">Fermée</option>
          </select>
        </div>

        <!-- Désignation du dirigeant (uniquement à la création) -->
        <fieldset v-if="!estModification" class="bloc-dirigeant">
          <legend>Dirigeant de l'église</legend>
          <div class="choix">
            <label><input type="radio" value="existant" v-model="modeDirigeant" /> Choisir un disciple existant</label>
            <label><input type="radio" value="nouveau" v-model="modeDirigeant" /> Créer un nouveau dirigeant</label>
          </div>

          <div v-if="modeDirigeant === 'existant'" class="form-group">
            <label>Disciple du pays sélectionné</label>
            <select v-model="idDirigeant" :disabled="!form.paysCode">
              <option value="">— Choisir —</option>
              <option v-for="d in candidats" :key="d.idDisciple" :value="d.idDisciple">
                {{ d.prenom }} {{ d.nom }} ({{ d.telephone }})
              </option>
            </select>
            <span v-if="form.paysCode && !candidats.length" class="aide-champ">
              Aucun disciple disponible dans ce pays — créez plutôt un nouveau dirigeant.
            </span>
          </div>

          <div v-else class="form-row">
            <div class="form-group"><label>Prénom *</label><input v-model="nouveau.prenom" type="text" /></div>
            <div class="form-group"><label>Nom *</label><input v-model="nouveau.nom" type="text" /></div>
            <div class="form-group"><label>Téléphone *</label><input v-model="nouveau.telephone" type="tel" /></div>
            <div class="form-group"><label>Mot de passe temporaire *</label><input v-model="nouveau.motDePasse" type="password" /></div>
          </div>
        </fieldset>

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
import { reactive, ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEglisesStore } from '@/stores/eglises';
import { useDisciplesStore } from '@/stores/disciples';
import { listePays, villesDuPays, sousRegionDuPays } from '@/services/geographie';
import AlertMessage from '@/components/common/AlertMessage.vue';

const route = useRoute();
const router = useRouter();
const store = useEglisesStore();
const disciplesStore = useDisciplesStore();

const estModification = computed(() => !!route.params.id);
const pays = listePays();
const erreur = ref('');
const succes = ref('');
const loading = ref(false);

const form = reactive({ nomEglise: '', paysCode: '', ville: '', capaciteMax: 30, statutEglise: 'Active' });
const modeDirigeant = ref('nouveau');
const idDirigeant = ref('');
const nouveau = reactive({ nom: '', prenom: '', telephone: '', motDePasse: '' });

// Villes et sous-région dérivées du pays choisi
const villes = computed(() => villesDuPays(form.paysCode));
const region = computed(() => sousRegionDuPays(form.paysCode));
const paysNom = computed(() => pays.find((p) => p.code === form.paysCode)?.nom || '');

// Candidats dirigeants : disciples simples du pays sélectionné
const candidats = computed(() =>
  disciplesStore.disciples.filter((d) => d.role === 'Disciple' && d.pays === paysNom.value)
);

// Si on change de pays, on réinitialise la ville et le dirigeant choisi
watch(() => form.paysCode, () => { form.ville = ''; idDirigeant.value = ''; });

onMounted(async () => {
  if (estModification.value) {
    await store.fetchById(route.params.id);
    const e = store.eglise;
    if (e) {
      Object.assign(form, { nomEglise: e.nomEglise, ville: e.ville, capaciteMax: e.capaciteMax, statutEglise: e.statutEglise });
      form.paysCode = pays.find((p) => p.nom === e.pays)?.code || '';
    }
  } else {
    // On charge la liste des disciples pour proposer un dirigeant existant
    await disciplesStore.fetchAll();
  }
});

async function sauvegarder() {
  erreur.value = '';
  succes.value = '';
  loading.value = true;
  try {
    if (estModification.value) {
      await store.update(route.params.id, {
        nomEglise: form.nomEglise, ville: form.ville, paysCode: form.paysCode,
        capaciteMax: form.capaciteMax, statutEglise: form.statutEglise,
      });
    } else {
      const payload = {
        nomEglise: form.nomEglise, ville: form.ville, paysCode: form.paysCode, capaciteMax: form.capaciteMax,
      };
      if (modeDirigeant.value === 'existant') payload.idDirigeant = idDirigeant.value;
      else payload.nouveauDirigeant = { ...nouveau };
      await store.create(payload);
    }
    succes.value = 'Église enregistrée avec succès.';
    setTimeout(() => router.push('/app/eglises'), 1200);
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
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.75rem; box-shadow: var(--shadow-sm); max-width: 640px; }
.formulaire { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.form-group input, .form-group select { padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.9rem; outline: none; }
.form-group input:focus, .form-group select:focus { border-color: var(--primary); }
.champ-lecture { background: var(--bg-page); color: var(--text-secondary); }
.aide-champ { font-size: 0.75rem; color: var(--text-light); }
.bloc-dirigeant { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.bloc-dirigeant legend { font-size: var(--font-size-sm); font-weight: 600; color: var(--primary); padding: 0 0.4rem; }
.choix { display: flex; gap: 1.5rem; font-size: var(--font-size-sm); }
.choix label { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
.btn-annuler { padding: 0.55rem 1rem; border: 1px solid var(--border); background: var(--bg-card); border-radius: var(--radius-sm); font-size: var(--font-size-sm); text-decoration: none; color: var(--text-primary); }
.btn-sauvegarder { padding: 0.55rem 1.25rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; }
.btn-sauvegarder:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
