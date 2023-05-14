export { convertExcelSheetToLedgerTrnJsonlFile };

import { platform } from 'https://deno.land/std@0.171.0/node/process.ts';
import { readLines } from 'https://deno.land/std@0.152.0/io/buffer.ts';
import { win32 } from 'https://deno.land/std@0.182.0/path/mod.ts';

import { SimObject } from '../engine/simobject/simobject.js';

import { existSync } from './exist_sync.js';
import { downloadAndDecompressGzip } from './download_and_decompress_gzip.js';

//#region OPTIONS
const OPTIONS__CONVERTER_EXE_GZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter2.exe.gz';
const OPTIONS__CONVERTER_EXE_NAME = './converter2.exe';

//#endregion OPTIONS

/**
 * Convert Excel file to a JSONL file with ledger transactions
 * @param {Object} p
 * @param {string} p.excelInput - Excel file with user input
 * @param {string} p.jsonlOutput - JSONL file with ledger transactions
 * @param {string} p.sheetName - Excel sheet name
 * @returns {Promise<void>}
 */
async function convertExcelSheetToLedgerTrnJsonlFile ({ excelInput, jsonlOutput, sheetName }) {
  if (!platformIsWindows)
    throw new Error('platform not supported');

  // build a path with OPTIONS__CONVERTER_EXE_NAME and this file path + normalize to win32 path
  const converterExePath = win32.fromFileUrl(new URL(OPTIONS__CONVERTER_EXE_NAME, import.meta.url));  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186

  // create temporary file to store errors
  const tempErrorsFilePath = await Deno.makeTempFile();

  // download and decompress OPTIONS__CONVERTER_EXE_GZ_URL
  if (!existSync(converterExePath))
    await downloadAndDecompressGzip(
      { url: OPTIONS__CONVERTER_EXE_GZ_URL, path: converterExePath });

  // convert Excel input file to JSONL file with ledger transactions  // see  https://deno.land/manual@v1.29.3/examples/subprocess
  const p = Deno.run({
    cmd: [
      converterExePath, 'excel-sheet-to-jsonl-ledger-trn',
      '--input', excelInput,
      '--sheetname', sheetName,
      '--output', jsonlOutput,
      '--errors', tempErrorsFilePath
    ]
  });
  await p.status();  // await its completion
  p.close();  // close the process

  // throw error if there are errors
  if (existSync(tempErrorsFilePath)) {
    const errorsText = Deno.readTextFileSync(tempErrorsFilePath);  // see https://deno.land/api@v1.29.4?s=Deno.readTextFileSync
    throw new Error(`Errors during conversion of the Excel input file: ${errorsText}`);
  }
}

//#region private functions
/**
 @private
 Convert Excel input file to an array of `moduleData`
 * @return {boolean} - true if the platform is Windows
 */
function platformIsWindows () {
  // see https://deno.land/std@0.171.0/node/process.ts?s=platform
  // see also https://nodejs.org/api/process.html#process_process_platform
  //const platforms = ['aix', 'android', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32'];
  return (platform === 'win32');
}

//#endregion private functions
