import { dsb } from "../src/lib/bigint_decimal_scaled.fluent.js";

const out = dsb("10.50")
  .add("4.25")
  .sub("2")
  .mul(3)
  .div("0.5")
  .roundAccounting()
  .toString({ trim: true });

console.log(out);
