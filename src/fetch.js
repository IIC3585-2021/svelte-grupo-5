export const fetchDogBreeds = async () => {
    const data = await fetch('https://api.thedogapi.com/v1/breeds')
    const dogs = data.json()
    return dogs
}