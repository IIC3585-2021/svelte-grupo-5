<script>
  import { get } from 'svelte/store'
  import { dogs, favoriteCount } from '../store.js'

  export let dog;
  export let favorite;
  export let extra;

  const moreInfo = () => {
    console.log("see more button clicked");
    var id = "seeMore-button" + dog.id;
    var life = dog.life_span || "None";
    var origin = dog.origin || "None";
    var temperament = dog.temperament || "None";
    if (document.getElementById(dog.id).innerHTML == "-") {
      console.log("Lo encontro");
      document.getElementById(dog.id).innerHTML =
        "Life Span: " +
        life +
        ";\n Origin: " +
        origin +
        ";\n Temperament: " +
        temperament;
      document.getElementById(id).innerHTML = "See Less";
    } else {
      document.getElementById(dog.id).innerHTML = "-";
      document.getElementById(id).innerHTML = "See More";
    }
  };
  const removeFromFavorites = (dog) => {
    var oldCount = get(favoriteCount)
    favoriteCount.set(oldCount - 1)
    var newDogs = get(dogs)
    newDogs.map(option => {
       if (option.id === dog.id){
         option.isFavorite = false
       }
     })
    dogs.set(newDogs)
  };
  const addToFavorites = (dog) => {
    var oldCount = get(favoriteCount)
    favoriteCount.set(oldCount + 1)
    var newDogs = get(dogs)
    newDogs.map(option => {
       if (option.id === dog.id){
         option.isFavorite = true
       }
     })
    dogs.set(newDogs)
  };
</script>

<main>
  <img id="image" alt="dog" />
  <!-- info -->
  {#if extra}
    <div id="info-favorite">
      <h4>Breed: {dog.bred_for || "None"}</h4>
      <h4>Group: {dog.breed_group || "None"}</h4>
      <p id={dog.id}>-</p>
    </div>
  {:else}
    <div id="info-not-favorite">
      <h4>Breed: {dog.bred_for || "None"}</h4>
      <h4>Group: {dog.breed_group || "None"}</h4>
    </div>
  {/if}
  <!-- buttons -->
  {#if extra}
    <button id={"seeMore-button" + dog.id} on:click={moreInfo}>See More</button>
    <button on:click={removeFromFavorites(dog)}>Delete from Favorites</button>
  {:else}
    <button on:click={addToFavorites(dog)} disabled={favorite} 
    onclick="this.disabled=true">Add to Favorites</button>
  {/if}
</main>

<style>
  main {
    display: "flex";
    flex-direction: "column";
    background-color: "lightblue";
    width: "auto";
    height: "auto";
    padding: "5px";
    margin: "3px";
    border-radius: "0.25rem";
  }
  img {
    display: "flex";
    height: "200px";
    width: "200px";
    margin: "20px";
  }
  #info-favorite {
    display: "flex";
    flex-direction: "column";
    height: "auto";
    width: "200px";
    margin: "20px";
  }
  #info-not-favorite {
    display: "flex";
    flex-direction: "column";
    height: "150px";
    width: "200px";
    margin: "20px";
  }
</style>
