<template>
  <!-- Barre de navigation latérale fixe, adaptée au rôle de l'utilisateur -->
  <nav class="sidebar">
    <!-- Logo CMCI -->
    <div class="sidebar-brand">
      <img :src="logo" alt="Logo CMCI" class="brand-logo" />
      <span class="brand-name">CMCI</span>
    </div>

    <!-- Liens de navigation -->
    <ul class="nav-list">
      <li v-for="lien in liens" :key="lien.nom">
        <router-link :to="lien.vers" class="sidebar-link" active-class="sidebar-link-active">
          <AppIcon :name="lien.icone" :size="18" />
          <span>{{ lien.nom }}</span>
        </router-link>
      </li>
    </ul>

    <!-- Infos utilisateur + déconnexion en bas -->
    <div class="sidebar-footer">
      <router-link to="/app/profil" class="user-info">
        <!-- Avatar : photo si disponible, sinon initiales -->
        <img v-if="utilisateur?.photoUrl" :src="utilisateur.photoUrl" alt="Photo de profil" class="avatar" />
        <span v-else class="avatar avatar-initiales">{{ initiales }}</span>
        <span class="user-texte">
          <span class="user-nom">{{ utilisateur?.prenom }} {{ utilisateur?.nom }}</span>
          <span class="user-role">{{ utilisateur?.role }}</span>
        </span>
      </router-link>
      <button class="btn-logout" @click="deconnexion">
        <AppIcon name="logout" :size="16" />
        <span>Déconnexion</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
// Sidebar fixe qui affiche les liens selon le rôle de l'utilisateur connecté
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import AppIcon from '@/components/common/AppIcon.vue';
import logo from '@/assets/logo.png';

const router = useRouter();
const auth = useAuthStore();
const { utilisateur } = storeToRefs(auth);
const role = computed(() => utilisateur.value?.role || '');

// Initiales affichées dans l'avatar quand aucune photo n'est définie
const initiales = computed(() => {
  const u = utilisateur.value;
  if (!u) return '?';
  return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
});

// Lien « Mon Profil » commun à tous les rôles (chacun gère son compte et sa photo)
const lienProfil = { nom: 'Mon Profil', vers: '/app/profil', icone: 'profil' };

// Construction des liens de navigation selon le rôle
// Un seul lien par destination — pas de doublon "Mon Avancement / Évaluer Avancements"
const liens = computed(() => {
  const r = role.value;

  if (r === 'Disciple') {
    return [
      { nom: 'Tableau de bord', vers: '/app/dashboard', icone: 'dashboard' },
      { nom: 'Mes Routines',    vers: '/app/routines',  icone: 'routines' },
      { nom: 'Réunions',        vers: '/app/reunions',  icone: 'reunions' },
      { nom: 'Contenus',        vers: '/app/contenus',  icone: 'contenus' },
      { nom: 'Mon Avancement',  vers: '/app/validations', icone: 'validations' },
      lienProfil,
    ];
  }

  if (r === 'Dirigeant') {
    return [
      { nom: 'Tableau de bord', vers: '/app/dashboard', icone: 'dashboard' },
      { nom: 'Mes Routines',    vers: '/app/routines',  icone: 'routines' },
      { nom: 'Suivi routines',  vers: '/app/routines/suivi', icone: 'routines' },
      { nom: 'Mon Église',      vers: '/app/eglises',   icone: 'eglise' },
      { nom: 'Mes Disciples',   vers: '/app/disciples', icone: 'disciples' },
      { nom: 'Réunions',        vers: '/app/reunions',  icone: 'reunions' },
      { nom: 'Contenus',        vers: '/app/contenus',  icone: 'contenus' },
      { nom: 'Avancements',     vers: '/app/validations', icone: 'validations' },
      lienProfil,
    ];
  }

  if (['LeaderNat', 'LeaderReg', 'LeaderMon'].includes(r)) {
    return [
      { nom: 'Tableau de bord',    vers: '/app/dashboard', icone: 'dashboard' },
      { nom: 'Mes Routines',       vers: '/app/routines',  icone: 'routines' },
      { nom: 'Suivi routines',     vers: '/app/routines/suivi', icone: 'routines' },
      { nom: 'Tous les Disciples', vers: '/app/disciples', icone: 'disciples' },
      { nom: 'Toutes les Églises', vers: '/app/eglises',   icone: 'eglise' },
      { nom: 'Réunions',           vers: '/app/reunions',  icone: 'reunions' },
      { nom: 'Contenus',           vers: '/app/contenus',  icone: 'contenus' },
      { nom: 'Avancements',        vers: '/app/validations', icone: 'validations' },
      lienProfil,
    ];
  }

  if (r === 'RespContenus') {
    return [
      { nom: 'Tableau de bord', vers: '/app/dashboard', icone: 'dashboard' },
      { nom: 'Mes Routines',    vers: '/app/routines',  icone: 'routines' },
      { nom: 'Gérer Contenus',  vers: '/app/contenus',  icone: 'contenus' },
      lienProfil,
    ];
  }

  // Par défaut (rôle inconnu) — minimum
  return [{ nom: 'Tableau de bord', vers: '/app/dashboard', icone: 'dashboard' }, lienProfil];
});

function deconnexion() {
  auth.logout();
  router.push({ name: 'Login' });
}
</script>

<style scoped>
/* Sidebar fixe sur toute la hauteur de la fenêtre */
.sidebar {
  width: 260px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

/* Logo en haut */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--space-lg) var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.brand-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: #fff;
  border-radius: 50%;
  padding: 2px;
}
.brand-name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-white);
  letter-spacing: 0.08em;
}

/* Liste de liens */
.nav-list {
  list-style: none;
  padding: var(--space-sm) 0;
  flex: 1;
  overflow-y: auto;
}

/* Lien de navigation : icône + libellé alignés */
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px var(--space-lg);
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-sm);
  transition: var(--transition);
}
.sidebar-link:hover {
  color: var(--text-white);
  background: rgba(255, 255, 255, 0.08);
  text-decoration: none;
}
.sidebar-link-active {
  color: var(--text-white);
  background: rgba(255, 255, 255, 0.12);
  font-weight: 500;
}

/* Pied de sidebar : infos utilisateur */
.sidebar-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
/* Bloc utilisateur cliquable (mène à « Mon Profil ») */
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: var(--transition);
}
.user-info:hover {
  background: rgba(255, 255, 255, 0.08);
}
.user-texte {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}
/* Avatar (photo ou initiales) */
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.avatar-initiales {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  color: var(--text-white);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.user-nom {
  font-size: var(--font-size-sm);
  color: var(--text-white);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}
.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition);
}
.btn-logout:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-white);
}

/* Sur mobile, on masque la sidebar */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }
}
</style>
