function toFixed(num:number, decimalPlaces:number):number {
    var pow = Math.pow(10, decimalPlaces);
    return Math.round(num*pow) / pow;
}

console.log("9.99999 with 5 decimal places-> " + toFixed(9.99999, 5));
console.log("9.999999 with 5 decimal places-> " + toFixed(9.999999, 5));