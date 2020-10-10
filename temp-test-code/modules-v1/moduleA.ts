import { ValuesA as ValuesA1, ValuesB as ValuesB1 } from "./ExportValues2.ts";
import { ValuesA as ValuesA2, ValuesB as ValuesB2 } from "./lib/ExportValues3.ts";

console.log(ValuesA1.value + " " + ValuesB1.value);
console.log(ValuesA2.value + " " + ValuesB2.value);
