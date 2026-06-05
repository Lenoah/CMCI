<template>
  <div class="profil">
    <h1 class="page-titre">Mon Profil</h1>
    <p class="fil-ariane">Accueil · Mon Profil</p>

    <!-- ── Carte : photo + informations personnelles ── -->
    <div class="carte">
      <h3 class="carte-titre"><AppIcon name="profil" :size="18" /> Informations personnelles</h3>

      <div class="profil-haut">
        <!-- Avatar + bouton d'upload -->
        <div class="avatar-zone">
          <img v-if="form.photoUrl" :src="form.photoUrl" alt="Photo de profil" class="avatar-grand" />
          <span v-else class="avatar-grand avatar-initiales">{{ initiales }}</span>
          <label class="btn-photo">
            <AppIcon name="camera" :size="16" /> Changer la photo
            <input type="file" accept="image/*" @change="choisirPhoto" hidden />
          </label>
        </div>

        <!-- Champs modifiables -->
        <form class="form-grille" @submit.prevent="enregistrerProfil">
          <div class="champ">
            <label>Prénom</label>
            <input v-model="form.prenom" type="text" required />
          </div>
          <div class="champ">
            <label>Nom</label>
            <input v-model="form.nom" type="text" required />
          </div>
          <div class="champ">
            <label>Téléphone</label>
            <input v-model="form.telephone" type="tel" required />
          </div>
          <div class="champ">
            <label>Rôle</label>
            <input :value="utilisateur?.role" type="text" disabled />
          </div>
          <div class="champ">
            <label>Pays</label>
            <input :value="utilisateur?.pays || '—'" type="text" disabled />
          </div>
          <div class="champ">
            <label>Église</label>
            <input :value="utilisateur?.eglise?.nomEglise || '—'" type="text" disabled />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="loadingProfil">
              <AppIcon name="save" :size="16" /> {{ loadingProfil ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
      <AlertMessage :message="messageProfil" :type="typeProfil" />
    </div>

    <!-- ── Carte : changement de mot de passe ── -->
    <div class="carte">
      <h3 class="carte-titre"><AppIcon name="lock" :size="18" /> Changer mon mot de passe</h3>
      <form class="form-grille" @submit.prevent="changerMotDePasse">
        <div class="champ">
          <label>Mot de passe actuel</label>
          <input v-model="mdp.ancien" type="password" required />
        </div>
        <div class="champ">
          <label>Nouveau mot de passe</label>
          <input v-model="mdp.nouveau" type="password" minlength="6" required />
        </div>
        <div class="champ">
          <label>Confirmer le nouveau</label>
          <input v-model="mdp.confirmation" type="password" minlength="6" required />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loadingMdp">
            <AppIcon name="lock" :size="16" /> {{ loadingMdp ? 'Modification…' : 'Modifier le mot de passe' }}
          </button>
        </div>
      </form>
      <AlertMessage :message="messageMdp" :type="typeMdp" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import AppIcon from '@/components/common/AppIcon.vue';
import AlertMessage from '@/components/common/AlertMessage.vue';

const auth = useAuthStore();
const { utilisateur } = storeToRefs(auth);

// Formulaire profil (pré-rempli avec les infos du compte connecté)
const form = reactive({ nom: '', prenom: '', telephone: '', photoUrl: null });
const mdp = reactive({ ancien: '', nouveau: '', confirmation: '' });

const loadingProfil = ref(false);
const messageProfil = ref('');
const typeProfil = ref('succes');
const loadingMdp = ref(false);
const messageMdp = ref('');
const typeMdp = ref('succes');

const initiales = computed(() => {
  const u = utilisateur.value;
  return u ? `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase() : '?';
});

// On recharge le profil complet puis on remplit le formulaire
onMounted(async () => {
  const u = await auth.fetchMe();
  form.nom = u.nom;
  form.prenom = u.prenom;
  form.telephone = u.telephone;
  form.photoUrl = u.photoUrl || null;
});

// Lit l'image choisie, la redimensionne (max 256px) et la convertit en data URL.
// On réduit la taille pour ne pas stocker une image trop lourde en base.
function choisirPhoto(e) {
  const fichier = e.target.files[0];
  if (!fichier) return;
  const lecteur = new FileReader();
  lecteur.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 256;
      const ratio = Math.min(max / img.width, max / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      form.photoUrl = canvas.toDataURL('image/jpeg', 0.8);
    };
    img.src = lecteur.result;
  };
  lecteur.readAsDataURL(fichier);
}

// Enregistre nom / prénom / téléphone / photo puis met à jour la session
async function enregistrerProfil() {
  loadingProfil.value = true;
  messageProfil.value = '';
  try {
    const { data } = await api.put('/auth/me', {
      nom: form.nom, prenom: form.prenom, telephone: form.telephone, photoUrl: form.photoUrl,
    });
    auth.setUtilisateur(data);
    typeProfil.value = 'succes';
    messageProfil.value = 'Profil mis à jour avec succès.';
  } catch (err) {
    typeProfil.value = 'erreur';
    messageProfil.value = err.response?.data?.message || 'Erreur lors de la mise à jour.';
  } finally {
    loadingProfil.value = false;
  }
}

// Change le mot de passe après vérification de la confirmation
async function changerMotDePasse() {
  messageMdp.value = '';
  if (mdp.nouveau !== mdp.confirmation) {
    typeMdp.value = 'erreur';
    messageMdp.value = 'La confirmation ne correspond pas au nouveau mot de passe.';
    return;
  }
  loadingMdp.value = true;
  try {
    await api.put('/auth/password', { ancienMotDePasse: mdp.ancien, nouveauMotDePasse: mdp.nouveau });
    typeMdp.value = 'succes';
    messageMdp.value = 'Mot de passe modifié avec succès.';
    mdp.ancien = mdp.nouveau = mdp.confirmation = '';
  } catch (err) {
    typeMdp.value = 'erreur';
    messageMdp.value = err.response?.data?.message || 'Erreur lors du changement de mot de passe.';
  } finally {
    loadingMdp.value = false;
  }
}
</script>

<style scoped>
.page-titre { font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); margin: 0; }
.fil-ariane { font-size: 0.8rem; color: var(--text-light); margin: 0 0 var(--space-lg); }
.carte { background: var(--bg-card); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: var(--space-lg); box-shadow: var(--shadow-sm); }
.carte-titre { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; color: var(--primary); margin: 0 0 1.25rem; }
.profil-haut { display: flex; gap: var(--space-xl); flex-wrap: wrap; }
.avatar-zone { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); }
.avatar-grand { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; }
.avatar-initiales { display: flex; align-items: center; justify-content: center; background: var(--primary); color: var(--text-white); font-size: 2.5rem; font-weight: 600; }
.btn-photo { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: var(--font-size-sm); color: var(--primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.4rem 0.75rem; transition: var(--transition); }
.btn-photo:hover { background: var(--bg-page); }
.form-grille { flex: 1; min-width: 280px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-md); }
.champ { display: flex; flex-direction: column; gap: 0.3rem; }
.champ label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; }
.champ input { padding: 0.55rem 0.7rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.95rem; outline: none; transition: var(--transition); }
.champ input:focus { border-color: var(--primary); }
.champ input:disabled { background: var(--bg-page); color: var(--text-secondary); }
.form-actions { grid-column: 1 / -1; }
.btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 0.6rem 1.2rem; background: var(--primary); color: var(--text-white); border: none; border-radius: var(--radius-sm); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: var(--transition); }
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
