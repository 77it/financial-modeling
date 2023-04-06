// run with `deno test --allow-env --allow-read --allow-net`

import { text_davinci_003__single_message, gpt_3_5_turbo__chat, TEXT_DAVINCI_003__MAX_TOKENS } from '../../src/deno/ai.js';

import { toStringYYYYMMDD } from '../../src/lib/date_utils.js';
import { assert, assertFalse, assertEquals, assertNotEquals, assertThrows } from '../deps.js';

// next year, first day of the year, to string YYYY-MM-DD
const _nextYearStart = toStringYYYYMMDD(new Date(new Date().getFullYear() + 1, 0, 1));
const _nextYearEnd = toStringYYYYMMDD(new Date(new Date().getFullYear() + 1, 11, 1));

const financial_forecast__system_prompt =
  `You are a financial consultant preparing a financial forecast for a company.
The user will clarify the business model of the company to forecast.
The output will be in JSON format, an array of objects.
The output will contain all the economic and financial movements of the company.
If not differently specified by the user, the date of the movements will be from ${_nextYearStart} to ${_nextYearEnd}.
You can output only objects describing loans, revenues, expenses.
The type field can contain only the strings "loan", "revenue" or "expense".
A sample json will be the following (start with \`\`\` and close it with \`\`\`):

\`\`\`
[
  {"type":"loan", "description": "loan to purchase the pizza machine", "amount": 10000, "startDate": "2023-01-01", "numberOfPayments": 60},
  {"type":"revenue", "description": "sold pizza", "amount": 50, "date": "2023-01-01"},
  {"type":"revenue", "description": "sold pizza", "amount": 60, "date": "2023-02-15"},
  {"type":"expense", "description": "wages", "amount": 25, "date": "2023-01-03"}
]
\`\`\`
Be precise and careful with the numbers, dates and JSON format.
`;

Deno.test('text-davinci-003 tests', async () => {
  const forecast_type = 'forecast from 2025-01-01 to 2025-12-31. forecast a candy shop. 1 employee, 1 machine, 1 location, 1 kg of candies per day sold at 100 usd each.'
  //const forecast_type = 'forecast a candy shop.'

  const system_prefix = '\nSystem directive follows.\n';
  const forecast_prefix = '\nThe user request follows.\n';

  const prompt = `${system_prefix}${financial_forecast__system_prompt}${forecast_prefix}${forecast_type}`;

  const model_input = {
    prompt: prompt,
    temperature: 0.8,
    max_tokens: TEXT_DAVINCI_003__MAX_TOKENS
  };

  console.log(prompt);
  console.log(model_input);

  console.log(await text_davinci_003__single_message(model_input));
});


Deno.test('gpt-3.5-turbo tests', async () => {
  const model_input = {
    systemPrompt: financial_forecast__system_prompt,
    temperature: 0.8
  };

  console.log(await gpt_3_5_turbo__chat(model_input));
});
