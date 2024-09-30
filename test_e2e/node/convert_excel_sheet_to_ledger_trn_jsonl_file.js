export { convertExcelSheetToLedgerTrnJsonlFile };

import { execFileSync } from 'node:child_process';

import { existsSync } from '../../src/node/exists_sync.js';
import { platformIsWindows } from '../../src/node/platform_is_windows.js';
import { downloadFromUrl } from '../../src/node/download_from_url.js';
import { readUtf8TextFileRemovingBOM } from '../../src/node/read_utf8_text_file_removing_bom.js';

//#region OPTIONS
const OPTIONS__CONVERTER_EXE_GZ_URL = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.6/Converter2.exe';
const OPTIONS__CONVERTER_EXE_NAME = '../bin/converter2.exe';

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

  // build a path with OPTIONS__CONVERTER_EXE_NAME and this file path + normalize to windows path
  // see https://github.com/denoland/deno/issues/1286#issuecomment-643624186
  // & https://developer.mozilla.org/en-US/docs/Web/API/URL
  const _converterExePath = (new URL(OPTIONS__CONVERTER_EXE_NAME, import.meta.url)).pathname;
  const converterExePath = _converterExePath.startsWith('/') ? _converterExePath.slice(1) : _converterExePath;

  // download and decompress OPTIONS__CONVERTER_EXE_GZ_URL
  if (!existsSync(converterExePath))
    await downloadFromUrl(
      { url: OPTIONS__CONVERTER_EXE_GZ_URL, filepath: converterExePath });

  //#region convert Excel input file to JSONL file with ledger transactions
  const tempErrorsFilePath = excelInput + '.errors.tmp';

  const args = [
    'excel-sheet-to-jsonl-ledger-trn',
    '--input', excelInput,
    '--sheetname', sheetName,
    '--output', jsonlOutput,
    '--errors', tempErrorsFilePath
  ];
  const { stdout_string, exit_code } = (() => {
    try {
      // see https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/
      // see https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback
      const stdout_string = execFileSync(converterExePath, args, {encoding: 'utf8'});  // will print stderr without intercepting it
      return {stdout_string: stdout_string, exit_code: 0};
    } catch (error) {
      console.log(error);
      return {stdout_string: '', exit_code: 1};
    }
  })();
  //#endregion convert Excel input file to JSONL file with ledger transactions

  // throw error if there are errors
  if (exit_code !== 0 || existsSync(tempErrorsFilePath)) {
    const errorsText = readUtf8TextFileRemovingBOM(tempErrorsFilePath);
    throw new Error(`Errors during conversion of the Excel input file: ${errorsText}`);
  }

  // throw error if output file does not exist
  if (!existsSync(jsonlOutput)) {
    throw new Error(`Errors during conversion of the Excel input file: output file ${jsonlOutput} does not exist`);
  }
}
