// run with   deno run --allow-env --allow-read --allow-net

export { text_davinci_003__single_message, gpt__chat, TEXT_DAVINCI__MODEL, TEXT_DAVINCI_003__MAX_TOKENS, GPT_3_5_TURBO__MODEL, GPT_4__MODEL };

// from https://platform.openai.com/docs/libraries
// npm library https://www.npmjs.com/package/openai
// deno & npm compatibility   https://deno.land/manual@v1.32.3/node
//                            https://deno.land/manual@v1.32.3/node/npm_specifiers

// usage guide
// https://platform.openai.com/docs/guides/chat
//   chat format   https://platform.openai.com/docs/guides/chat/introduction
//   API reference   https://platform.openai.com/docs/api-reference/introduction?lang=node.js
//   OpenAI Cookbook: improve reliability   https://github.com/openai/openai-cookbook/blob/main/techniques_to_improve_reliability.md

// [GPT-3.5 Models]
// https://platform.openai.com/docs/models/gpt-3-5
// gpt-3.5-turbo   Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003. Will be updated with our latest model iteration.
// text-davinci-003   Can do any language task with better quality, longer output, and consistent instruction-following than the curie, babbage, or ada models. Also supports inserting completions within text.

// [Temperature]
// https://platform.openai.com/docs/api-reference/completions/create#completions/create-temperature
// https://platform.openai.com/docs/guides/chat/instructing-chat-models

// [Tokenizer]
// https://platform.openai.com/tokenizer

import { Configuration, OpenAIApi } from 'npm:openai@3.2.1';

const TEXT_DAVINCI_003__MAX_TOKENS = 2048;
const TEXT_DAVINCI__MODEL = 'text-davinci-003';
const GPT_3_5_TURBO__MODEL = 'gpt-3.5-turbo';
const GPT_4__MODEL = 'gpt-4';

const configuration = new Configuration({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});
const openai = new OpenAIApi(configuration);

/**
 * @param {Object} p
 * @param {string} p.model - model for the AI
 * @param {string} p.prompt
 * @param {number} [p.temperature=0.2] - temperature for the AI, between 0 and 1, default 0.2; higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. [https://platform.openai.com/docs/guides/chat/instructing-chat-models]
 * @param {number} [p.max_tokens] - max tokens for the AI
 * @returns {Promise<string>} - the AI's response
 */
async function text_davinci_003__single_message ({ model, prompt, temperature = 0.2, max_tokens }) {
  // normalize temperature, constrained between 0 and 1
  const _temperature = Math.max(0, Math.min(1, temperature));
  const _max_tokens = max_tokens ?? TEXT_DAVINCI_003__MAX_TOKENS;

  // see https://platform.openai.com/docs/api-reference/completions/create
  const completion = await openai.createCompletion({
    model: model,
    prompt: prompt,
    max_tokens: _max_tokens,
    temperature: _temperature,
  });

  //console.log(completion);
  return (completion.data.choices[0].text) ?? '';
}

/**
 * @param {Object} p
 * @param {string} p.model - model for the AI
 * @param {string} p.systemPrompt - system prompt for the AI
 * @param {number} [p.temperature=0.2] - temperature for the AI, between 0 and 1, default 0.2; higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. [https://platform.openai.com/docs/guides/chat/instructing-chat-models]
 * @returns {Promise<string>} - the AI's response
 */
async function gpt__chat ({ model, systemPrompt, temperature = 0.2 }) {
  // normalize temperature, constrained between 0 and 1
  const _temperature = Math.max(0, Math.min(1, temperature));

  console.log(`System prompt:\n${systemPrompt}\n\n`);
  const userPrompt = prompt('This is the beginning of your chat with AI. [To exit, send "###".]\n\nYou:') ?? '';
  if (userPrompt === '###')
    return '';

  /** @type {Array<{role: 'system'|'user'|'assistant', content: string}>} */
  const conversation = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  while (true) {
    // see https://platform.openai.com/docs/api-reference/chat/create
    const completion = await openai.createChatCompletion({
      model: model,
      messages: conversation,
      temperature: _temperature,  // For temperature, higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. [https://platform.openai.com/docs/guides/chat/instructing-chat-models]
    });
    if (completion.data.choices[0].message)
      conversation.push(completion.data.choices[0].message);
    const userPrompt = prompt(`Assistant: ${completion.data.choices[0].message?.content}\nYou:`) ?? '###';
    if (userPrompt === '###')
      break;
    conversation.push({ role: 'user', content: userPrompt });
    console.log(conversation);
  }
  console.log('');
  console.log('*** last message ***');
  console.log('');

  // returns last conversation entry
  return (conversation[conversation.length - 1].content);
}
