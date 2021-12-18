// from https://stackoverflow.com/a/17500836/5288052 & https://stackoverflow.com/questions/17500312/is-there-some-way-i-can-join-the-contents-of-two-javascript-arrays-much-like-i

const equijoin = (xs, ys, primary, foreign, sel) => {
    const ix = xs.reduce((ix, row) => ix.set(row[primary], row), new Map);
    return ys.map(row => sel(ix.get(row[foreign]), row));
};

const userProfiles = [
    {id: 1, name: "Ashok"},
    {id: 2, name: "Amit"},
    {id: 3, name: "Rajeev"},
];

const questions = [
    {id: 1, text: "text1", createdBy: 2},
    {id: 2, text: "text2", createdBy: 2},
    {id: 3, text: "text3", createdBy: 1},
    {id: 4, text: "text4", createdBy: 2},
    {id: 5, text: "text5", createdBy: 3},
    {id: 6, text: "text6", createdBy: 3},
];

const result = equijoin(userProfiles, questions, "id", "createdBy",
    ({name}, {id, text}) => ({id, text, name}));

console.log("Open your browser console to see the output.");

console.table(result);