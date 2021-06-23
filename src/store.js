import { writable, get } from 'svelte/store'


var allDogs = []
var allFilters =  [{name: "Toy", applied: false }, {name: "Working", applied: false}, {name:"Terrier", applied: false}, {name:"Mixed", applied: false}, {name: "Herding", applied: false}, {name: "Non-Sporting", applied: false}, {name:"Hound", applied: false}]



export const loading = writable(true)
export const dogs = writable(allDogs)
export const filters = writable(allFilters)
export const favoriteCount = writable(0)


filters.subscribe(newFilters => {
    var selectedBreeds = []
    newFilters.forEach(filter => {
        if(filter.applied == true){
            selectedBreeds.push(filter.name)
        }
    })
    var oldDogs = get(dogs)
    oldDogs.map(dog => dog.isFiltered = selectedBreeds.includes(dog.breed_group))
    dogs.set(oldDogs)
  })


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
        breed_group: "Toy",
        life_span: 2,
        origin: "USA",
        temperament: "funny",
      },
      {
        id: 4,
        bred_for: "jijij",
        breed_group: "working",
        life_span: 10,
        origin: "Chile",
        temperament: "sassy",
      },
    ];

fetch('https://api.thedogapi.com/v1/breeds')
.then((response) => response.json())
.then((data) => {
    allDogs = data
    dogs.set(extendDogObject(data));
    loading.set(false)
})

const extendDogObject = function(previousDogs){
    var newList = []
    previousDogs.forEach(element => {
        var extendedElement = element
        extendedElement["isFavorite"] = false
        extendedElement["isFiltered"] = false
        newList.push(extendedElement)
        }
    );
    return newList

}

