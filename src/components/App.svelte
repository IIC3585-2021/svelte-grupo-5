<script>
  import Dogs from "./Dogs.svelte";
  import Filters from "./Filters.svelte";
  import Applied from "./Applied.svelte";
  import FilteredDogs from "./FilteredDogs.svelte";
  import FavoriteDogs from "./FavoriteDogs.svelte";
</script>

<main>
  <h1>DOG ENCYCLOPEDIA</h1>
  <Dogs />
  <hr />
  <Filters />
  <hr />
  <Applied />
  <hr />
  <FilteredDogs />
  <hr />
  <FavoriteDogs />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
