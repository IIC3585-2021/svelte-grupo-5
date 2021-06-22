<script>
  import { each } from "svelte/internal";
  import DogCard from "./DogCard.svelte";
  let dogs = [
    { bred_for: "hola", breed_group: "hola" },
    { bred_for: "chao", breed_group: "chao" },
    { bred_for: "wena", breed_group: "wena" },
    { bred_for: "jijij", breed_group: "jijiji" },
  ];
</script>

<main>
  <h1>Dogs List</h1>
  {#each dogs as dog}
    <DogCard favorite={false} filtered={false} {dog} />
  {/each}
</main>

<style>
</style>
