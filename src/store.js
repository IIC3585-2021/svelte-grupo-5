import { writable } from 'svelte/store'

var allDogs;
var allFilters =  [{name: "Toy", applied: false }, {name: "Working", applied: false}, {name:"Terrier", applied: false}, {name:"Mixed", applied: false}, {name: "Herding", applied: false}, {name: "Non-Sporting", applied: false}, {name:"Hound", applied: false}]


export const loading = writable(true)
export const dogs = writable(allDogs)
export const favorites = writable([])
export const filters = writable(allFilters)



const exampleDogs = [
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

fetch('https://api.thedogapi.com/v1/breeds')
.then((response) => response.json())
.then((data) => {
    allDogs = data
    // DEMO PURPOSES --------------
    //dogs.set(exampleDogs)
    // REAL FETCH -----------------
    dogs.set(data);
    loading.set(false)
})

