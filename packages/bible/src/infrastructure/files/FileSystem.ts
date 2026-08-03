export interface FileSystem {

    readFile(
        path: string,
    ): Promise<string>;

    readDirectory(
        path: string,
    ): Promise<readonly string[]>;

}