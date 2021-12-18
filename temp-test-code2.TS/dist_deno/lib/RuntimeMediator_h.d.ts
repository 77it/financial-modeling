export interface IRuntimeMediator {
    readFileSync(path: string): string;
    appendFileSync(path: string, contents: string): void;
    existsSync(path: string): void;
    unlinkSync(path: string): void;
}
