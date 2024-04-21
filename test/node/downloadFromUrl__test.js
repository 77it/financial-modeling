// run with  --allow-read --allow-write --allow-net --allow-run --allow-env

import { downloadFromUrl } from '../../src/node/download_from_url.js';

import { existsSync } from '../../src/node/exists_sync.js';
import fs from 'node:fs';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = (typeof Deno !== 'undefined') ? Deno.test : test;  // to force testing under Deno with its logic and internals

t('downloadFromUrl tests', async () => {
  const url = 'https://github.com/77it/financial-modeling-binaries/releases/download/v0.0.5/Converter.exe';
  const filepath = './converter.exe';

  await downloadFromUrl({ url, filepath });

  assert(existsSync(filepath));

  fs.unlinkSync(filepath);  // throws if file does not exist
});
