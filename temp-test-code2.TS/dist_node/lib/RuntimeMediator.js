"use strict";
// implementation of FS and ore core node.js functions
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeMediator = void 0;
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
class RuntimeMediator {
    constructor() { }
    readFileSync(path) {
        return fs.readFileSync(path, 'utf8'); // see https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
    }
    appendFileSync(path, contents) {
        fs.appendFileSync(path, contents); // see https://nodejs.org/api/fs.html#fs_fs_appendfilesync_path_data_options
    }
    existsSync(path) {
        return fs.existsSync(path); // see https://nodejs.org/api/fs.html#fs_fs_existssync_path
    }
    unlinkSync(path) {
        fs.unlinkSync(path); // see https://nodejs.org/api/fs.html#fs_fs_unlinksync_path
    }
    // print a message to console, overwring the last message, padding the string with spaces for `charsNumber` times
    // inspired to https://stackoverflow.com/a/38724334/5288052 + https://stackoverflow.com/questions/34570452/node-js-stdout-clearline-and-cursorto-functions
    overwriteConsoleMessage(msg, charsNumber) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(msg.padEnd(charsNumber, " "));
    }
}
exports.RuntimeMediator = RuntimeMediator;
