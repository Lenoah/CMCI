// Configuration du routeur Vue — toutes les routes de l'application
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  // ── Pages publiques (non connecté) ────────────────────────────
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true },
  },

  // ── Pages protégées (connecté) — toutes utilisent AppLayout ───
  {
    path: '/app',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // Dashboard (s'adapte selon le rôle)
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/DashboardView.vue') },

      // Disciples
      { path: 'disciples', name: 'Disciples', component: () => import('@/views/disciples/DisciplesList.vue') },
      { path: 'disciples/nouveau', name: 'DiscipleNouv',
        component: () => import('@/views/disciples/DiscipleForm.vue'),
        meta: { roles: ['Dirigeant', 'LeaderNat', 'LeaderReg', 'LeaderMon'] } },
      { path: 'disciples/:id', name: 'DiscipleDetail', component: () => import('@/views/disciples/DiscipleDetail.vue') },
      { path: 'disciples/:id/modifier', name: 'DiscipleModif',
        component: () => import('@/views/disciples/DiscipleForm.vue'),
        meta: { roles: ['Dirigeant', 'LeaderNat', 'LeaderReg', 'LeaderMon'] } },

      // Églises — création / modification réservée aux Leaders
      { path: 'eglises', name: 'Eglises', component: () => import('@/views/eglises/EglisesList.vue') },
      { path: 'eglises/nouvelle', name: 'EgliseNouvelle',
        component: () => import('@/views/eglises/EgliseForm.vue'),
        meta: { roles: ['LeaderNat', 'LeaderReg', 'LeaderMon'] } },
      { path: 'eglises/:id', name: 'EgliseDetail', component: () => import('@/views/eglises/EgliseDetail.vue') },
      { path: 'eglises/:id/modifier', name: 'EgliseModif',
        component: () => import('@/views/eglises/EgliseForm.vue'),
        meta: { roles: ['LeaderNat', 'LeaderReg', 'LeaderMon'] } },

      // Réunions — création réservée aux Dirigeants
      { path: 'reunions', name: 'Reunions', component: () => import('@/views/reunions/ReunionsList.vue') },
      { path: 'reunions/nouvelle', name: 'ReunionNouvelle',
        component: () => import('@/views/reunions/ReunionForm.vue'),
        meta: { roles: ['Dirigeant'] } },
      { path: 'reunions/:id', name: 'ReunionDetail', component: () => import('@/views/reunions/ReunionDetail.vue') },
      { path: 'reunions/:id/presences', name: 'Presences',
        component: () => import('@/views/reunions/PresenceView.vue'),
        meta: { roles: ['Dirigeant'] } },

      // Routines spirituelles — chaque disciple gère les siennes
      { path: 'routines', name: 'Routines', component: () => import('@/views/routines/RoutinesList.vue') },
      { path: 'routines/nouvelle', name: 'RoutineNouvelle', component: () => import('@/views/routines/RoutineForm.vue') },
      { path: 'routines/:id/modifier', name: 'RoutineModif', component: () => import('@/views/routines/RoutineForm.vue') },

      // Contenus — publication / traduction réservée à RespContenus
      { path: 'contenus', name: 'Contenus', component: () => import('@/views/contenus/ContenusList.vue') },
      { path: 'contenus/nouveau', name: 'ContenuNouveau',
        component: () => import('@/views/contenus/ContenuForm.vue'),
        meta: { roles: ['RespContenus'] } },
      { path: 'contenus/:id', name: 'ContenuDetail', component: () => import('@/views/contenus/ContenuDetail.vue') },
      { path: 'contenus/:id/traduction', name: 'TraductionForm',
        component: () => import('@/views/contenus/TraductionForm.vue'),
        meta: { roles: ['RespContenus'] } },

      // Validations d'avancement — création réservée au Dirigeant
      { path: 'validations', name: 'Validations', component: () => import('@/views/validations/ValidationsList.vue') },
      { path: 'validations/nouvelle', name: 'ValidationNouvelle',
        component: () => import('@/views/validations/DemandeForm.vue'),
        meta: { roles: ['Dirigeant'] } },
      { path: 'validations/:id', name: 'ValidationDetail', component: () => import('@/views/validations/ValidationDetail.vue') },
    ],
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard de navigation : vérifie l'authentification ET le rôle requis
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login' };
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'Dashboard', replace: true };
  }
  // Restriction par rôle : si la route déclare meta.roles, on vérifie le rôle utilisateur
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'Dashboard', replace: true };
  }
});

export default router;
