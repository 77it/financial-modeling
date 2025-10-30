import { dsb } from "../src/lib/decimal_scaled_bigint__dsbvalue.fluent.js";

const out = dsb("10.50")
  .add("4.25")
  .sub("2")
  .mul(3)
  .div("0.5")
  .roundToAccounting()
  .toString({ trim: true });

console.log(out);
