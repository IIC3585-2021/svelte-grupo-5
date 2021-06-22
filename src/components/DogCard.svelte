<script>
  export let dog;
  export let favorite;
  export let filtered;

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
    console.log("remove from favorites button clicked");
  };
  const addToFavorites = (dog) => {
    console.log("add to favorites button clicked");
  };
</script>

<main>
  <img id="image" alt="dog" />
  <!-- info -->
  {#if favorite}
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
  {#if favorite}
    <button id={"seeMore-button" + dog.id} on:click={moreInfo}>See More</button>
    <button on:click={removeFromFavorites(dog)}>Delete from Favorites</button>
  {/if}
  {#if filtered}
    <button on:click={addToFavorites(dog)} onclick="this.disabled=true"
      >Add to Favorites</button
    >
  {/if}
  {#if favorite == false}
    {#if filtered == false}
      <button on:click={addToFavorites(dog)} onclick="this.disabled=true"
        >Add to Favorites</button
      >
    {/if}
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
