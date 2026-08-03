import { promises as fs } from "node:fs";

import { FileSystem } from "./FileSystem.js";

export class NodeFileSystem
    implements FileSystem {

    public async readFile(
        path: string,
    ): Promise<string> {

        return fs.readFile(
            path,
            "utf8",
        );

    }

    public async readDirectory(
        path: string,
    ): Promise<readonly string[]> {

        return fs.readdir(path);

    }

}