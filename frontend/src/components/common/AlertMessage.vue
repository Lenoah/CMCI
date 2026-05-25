<template>
  <!-- Message d'alerte : succès, erreur ou information -->
  <div v-if="message" class="alert" :class="`alert-${type}`">
    {{ message }}
  </div>
</template>

<script setup>
// Composant d'alerte réutilisable dans tous les formulaires et pages
defineProps({
  message: { type: String, default: '' },
  type: {
    type: String,
    default: 'info',
    validator: (v) => ['info', 'succes', 'erreur'].includes(v),
  },
});
</script>

<style scoped>
.alert {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
}
/* Couleurs douces — CLAUDE.md : pas de rouge vif agressif */
.alert-info    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.alert-succes  { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.alert-erreur  { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
</style>
