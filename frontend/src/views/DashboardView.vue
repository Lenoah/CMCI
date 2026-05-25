<template>
  <!-- Dashboard principal : redirige vers le dashboard adapté au rôle -->
  <div>
    <DiscipleDashboard v-if="role === 'Disciple'" />
    <DirigeantDashboard v-else-if="role === 'Dirigeant'" />
    <LeaderDashboard v-else-if="estLeader" />
    <DiscipleDashboard v-else />
  </div>
</template>

<script setup>
// Ce composant choisit quel tableau de bord afficher selon le rôle de l'utilisateur
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import DiscipleDashboard from './dashboard/DiscipleDashboard.vue';
import DirigeantDashboard from './dashboard/DirigeantDashboard.vue';
import LeaderDashboard from './dashboard/LeaderDashboard.vue';

const auth = useAuthStore();
const role = computed(() => auth.utilisateur?.role || '');
const estLeader = computed(() => ['LeaderNat', 'LeaderReg', 'LeaderMon', 'RespContenus'].includes(role.value));
</script>
