// run with
// `deno run --allow-read --allow-write THIS-FILE.js --input INPUT --output OUTPUT --errors ERRORS`

import { parse } from "https://deno.land/std@0.172.0/flags/mod.ts";
import { main } from "./main-treasury-temp2.js";

// parse command line arguments
const args = parse(Deno.args)

await main({input: args?.input, output: args?.output, errors: args?.errors});

console.log('done');
