// implementation of FS and ore core node.js functions

import * as fs from 'fs';
import * as readline from 'readline';
import { IRuntimeMediator } from './RuntimeMediator_h';

export class RuntimeMediator implements IRuntimeMediator {

    constructor() { }

    readFileSync(path: string): string {
        return fs.readFileSync(path, 'utf8');  // see https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
    }

    appendFileSync(path: string, contents: string): void {
        fs.appendFileSync(path, contents);  // see https://nodejs.org/api/fs.html#fs_fs_appendfilesync_path_data_options
    }

    existsSync(path: string): boolean {
        return fs.existsSync(path);  // see https://nodejs.org/api/fs.html#fs_fs_existssync_path
    }

    unlinkSync(path: string): void {
        fs.unlinkSync(path);  // see https://nodejs.org/api/fs.html#fs_fs_unlinksync_path
    }

    // print a message to console, overwring the last message, padding the string with spaces for `charsNumber` times
    // inspired to https://stackoverflow.com/a/38724334/5288052 + https://stackoverflow.com/questions/34570452/node-js-stdout-clearline-and-cursorto-functions
    overwriteConsoleMessage(msg: string, charsNumber: number): void {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(msg.padEnd(charsNumber, " "));
    }
}
