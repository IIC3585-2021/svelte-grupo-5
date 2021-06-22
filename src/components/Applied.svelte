<script>
  import { each } from "svelte/internal";
  // import appliedFilters, {clearFilters}, {deleteFilters} from 'svelte/store/filters'
  let appliedFilters = ["1", "2"];
  const deleteFilter = (filter) => {
    console.log("delete filter from button");
  };
  const clearFilters = () => {
    console.log("clear filters from button");
  };
</script>

<main>
  <h1>Applied Filters</h1>
  {#each appliedFilters as filter}
    <div>
      {filter}
      <button on:click={deleteFilter(filter)}>Delete</button>
    </div>
  {/each}
  <button on:click={clearFilters()}>Clear All</button>
</main>

<style>
</style>
