//#region settings
const OPTIONS = {};
OPTIONS.FILES = {}
OPTIONS.FILES.CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v1.0.6/Converter.exe.gz';
OPTIONS.FILES.CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion settings

import { downloadAndDecompressGzip } from './deno/downloadAndDecompressGzip.js';
import { existSync } from './deno/existSync.js';

/**
 * @param {{input: string, output: string, errors: string}} p
 */
export async function main({input, output,  errors}) {
  if (!existSync(OPTIONS.FILES.CONVERTER_EXEGZ_PATH))
    await downloadAndDecompressGzip(
      { url: OPTIONS.FILES.CONVERTER_EXEGZ_URL, path: OPTIONS.FILES.CONVERTER_EXEGZ_PATH });

  // deserialize `modulesData` input calling Converter program  // see  https://deno.land/manual@v1.29.3/examples/subprocess
  const p = Deno.run({ cmd: [OPTIONS.FILES.CONVERTER_EXEGZ_PATH, "excel-modules-to-jsonl-modules", "--input", input, "--output", output, "--errors", errors] });
  await p.status();  // await its completion
  p.close();  // close the process

  // TODO * chiama engine.js passando modulesData[]
}
