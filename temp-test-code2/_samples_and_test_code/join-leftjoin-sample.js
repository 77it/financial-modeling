// inspired from https://stackoverflow.com/a/55642683/5288052 & https://stackoverflow.com/questions/17880476/joins-in-javascript

const people = 
[{id: 1, name: "Tom", carid: 1},
 {id: 2, name: "Bob", carid: 1},
 {id: 3, name: "Sir Benjamin Rogan-Josh IV", carid: 2}];

const cars=
[{id: 1, name: "Ford Fiesta", color: "blue"},
 {id: 2, name: "Ferrari", color: "red"},
 {id: 3, name: "Rover 25", color: "Sunset Melting Yellow with hints of yellow"}];
 
const leftJoin = (objArr1, objArr2, key1, key2) => objArr1.map(
    anObj1 => ({
        ...objArr2.find(
            anObj2 => anObj1[key1] === anObj2[key2]
        ),
        ...anObj1
    })
);

const peoplewithcars = leftJoin( people, cars, "carid", "id");

console.table(peoplewithcars);
