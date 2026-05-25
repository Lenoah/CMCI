<template>
  <!-- Carte de statistique : icône + valeur numérique + label descriptif -->
  <div class="stat-card">
    <div class="stat-valeur">{{ valeur }}</div>
    <div class="stat-label">{{ label }}</div>
  </div>
</template>

<script setup>
// Composant réutilisable pour les tableaux de bord
defineProps({
  valeur: { type: [Number, String], default: 0 },
  label: { type: String, required: true },
});
</script>

<style scoped>
.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Le chiffre principal : grand et en gras */
.stat-valeur {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: var(--space-xs);
}

/* Le label : petit et gris */
.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>
