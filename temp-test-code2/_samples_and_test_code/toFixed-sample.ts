// deno run THIS-FILE

function toFixed(num:number, decimalPlaces:number):number {
    var pow = Math.pow(10, decimalPlaces);
    return Math.round(num*pow) / pow;
}

console.log("9.99999 with 5 decimal places-> " + toFixed(9.99999, 5));
console.log("9.999999 with 5 decimal places-> " + toFixed(9.999999, 5));
console.log("0.00001 with 5 decimal places-> " + toFixed(0.00001, 5));
console.log("0.000001 with 5 decimal places-> " + toFixed(0.000001, 5));
console.log("-0.00001 with 5 decimal places-> " + toFixed(-0.00001, 5));
console.log("-0.000001 with 5 decimal places-> " + toFixed(-0.000001, 5));
