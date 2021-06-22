<script>
  import DogCard from "./DogCard.svelte";
  // import {filteredDogs} from 'svelte/store/applied'

  let filteredDogs = [
    {
      id: 1,
      bred_for: "hola",
      breed_group: "hola",
      life_span: 12,
      origin: "USA",
      temperament: "very angry",
    },
    {
      id: 2,
      bred_for: "chao",
      breed_group: "chao",
      life_span: 21,
      origin: "Australa",
      temperament: "very happy",
    },
    {
      id: 3,
      bred_for: "wena",
      breed_group: "wena",
      life_span: 2,
      origin: "USA",
      temperament: "funny",
    },
    {
      id: 4,
      bred_for: "jijij",
      breed_group: "jijiji",
      life_span: 10,
      origin: "Chile",
      temperament: "sassy",
    },
  ];
</script>

<main>
  <h1>Filtered Dogs</h1>
  {#if filteredDogs.length > 0}
  <div>
    {#each filteredDogs as dog}
      <DogCard favorite={false} filtered={true} {dog} />
    {/each}
  </div>
  {/if}
</main>

<style>
</style>
