// run with   deno run --allow-env --allow-read --allow-net

// from https://platform.openai.com/docs/libraries
// npm library https://www.npmjs.com/package/openai
// deno & npm compatibility   https://deno.land/manual@v1.32.3/node
//                            https://deno.land/manual@v1.32.3/node/npm_specifiers

//
// usage guide   https://platform.openai.com/docs/guides/chat
//    chat format   https://platform.openai.com/docs/guides/chat/introduction
// API reference   https://platform.openai.com/docs/api-reference/introduction?lang=node.js
// OpenAI Cookbook: improve reliability   https://github.com/openai/openai-cookbook/blob/main/techniques_to_improve_reliability.md


// [Models]
// https://platform.openai.com/docs/models/gpt-3-5
// gpt-3.5-turbo   Most capable GPT-3.5 model and optimized for chat at 1/10th the cost of text-davinci-003. Will be updated with our latest model iteration.
// text-davinci-003   Can do any language task with better quality, longer output, and consistent instruction-following than the curie, babbage, or ada models. Also supports inserting completions within text.

import { Configuration, OpenAIApi } from "npm:openai@3.2.1";

const configuration = new Configuration({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const openai = new OpenAIApi(configuration);

/* // text-davinci-003 sample
const completion = await openai.createCompletion({
  //model: "gpt-3.5-turbo",
  model: "text-davinci-003",
  prompt: "Hello world",
  temperature: 0,
});
console.log(completion.data.choices[0].text);
*/

const completion = await openai.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [{"role": "user", "content": "Say this is a test!"}],
  temperature: 0.2,  // For temperature, higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. [https://platform.openai.com/docs/guides/chat/instructing-chat-models]
});
console.log(completion.data.choices[0].message);
