// * scarica Converter.exe e deserializza
// * deserializza `modulesData` input
// * chiama engine.js passando modulesData[]

// gzip   https://medium.com/deno-the-complete-reference/zip-and-unzip-files-in-deno-ee282da7369f
// https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream/DecompressionStream
// https://deno.land/api@v1.21.3?s=DecompressionStream

//#region settings
const OPTIONS = {};
OPTIONS.FILES = {}
OPTIONS.FILES.CONVERTER_EXEGZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v1.0.6/Converter.exe.gz';
OPTIONS.FILES.CONVERTER_EXEGZ_PATH = './converter.exe';
//#endregion settings

import { downloadAndDecompressGzip } from './deno/downloadAndDecompressGzip.js';
import { existSync } from './deno/existSync.js';

if (!existSync('./converter.exe'))
  await downloadAndDecompressGzip(
    { url: OPTIONS.FILES.CONVERTER_EXEGZ_URL, path: OPTIONS.FILES.CONVERTER_EXEGZ_PATH });

console.log('done');
