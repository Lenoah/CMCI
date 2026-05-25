<template>
  <!-- Tableau de données générique avec recherche intégrée -->
  <div class="data-table-wrapper">
    <!-- Barre de recherche -->
    <div class="table-toolbar">
      <input
        v-model="recherche"
        type="text"
        placeholder="Rechercher..."
        class="search-input"
      />
      <slot name="actions" />
    </div>

    <!-- Le tableau -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in colonnes" :key="col.cle">{{ col.label }}</th>
            <th v-if="$slots.actions_ligne">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="lignesFiltrees.length === 0">
            <td :colspan="colonnes.length + 1" class="table-vide">Aucun résultat trouvé.</td>
          </tr>
          <tr v-for="ligne in lignesFiltrees" :key="ligne[cleId]">
            <td v-for="col in colonnes" :key="col.cle">{{ ligne[col.cle] }}</td>
            <td v-if="$slots.actions_ligne">
              <slot name="actions_ligne" :ligne="ligne" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
// Tableau générique : accepte des colonnes et des données en props
import { ref, computed } from 'vue';

const props = defineProps({
  colonnes: { type: Array, required: true }, // [{ cle: 'nom', label: 'Nom' }]
  donnees: { type: Array, default: () => [] },
  cleId: { type: String, default: 'id' }, // champ utilisé comme clé unique
});

const recherche = ref('');

// Filtrer les lignes selon la recherche
const lignesFiltrees = computed(() => {
  if (!recherche.value) return props.donnees;
  const terme = recherche.value.toLowerCase();
  return props.donnees.filter((ligne) =>
    props.colonnes.some((col) =>
      String(ligne[col.cle] ?? '').toLowerCase().includes(terme)
    )
  );
});
</script>

<style scoped>
.data-table-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border);
  gap: var(--space-md);
}

.search-input {
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  outline: none;
  min-width: 200px;
  transition: var(--transition);
}
.search-input:focus { border-color: var(--primary); }

.table-container { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-size-sm);
}

/* Headers sans fond coloré — CLAUDE.md : garder blanc */
.data-table th {
  text-align: left;
  padding: 12px var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border);
}

.data-table td {
  padding: 14px var(--space-md);
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
}

.data-table tr:hover td { background: var(--bg-page); }
.table-vide { text-align: center; color: var(--text-light); padding: var(--space-2xl); }
</style>
