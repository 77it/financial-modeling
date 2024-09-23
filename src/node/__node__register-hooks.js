// from https://nodejs.org/api/module.html#enabling  // NodeJs v22.9.0
// register-hooks.js
import { register } from 'node:module';

register('./__node__https-hooks.js', import.meta.url);