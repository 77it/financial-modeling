// run with
// deno run --allow-read --allow-write THIS.ts -i INPUT -o OUTPUT

import { parse } from "https://deno.land/std/flags/mod.ts";

const args = parse(Deno.args)
const text = Deno.readTextFileSync(args.i);

console.log(text);

Deno.writeTextFileSync(args.o, text);
