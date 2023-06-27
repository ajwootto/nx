"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTmpSwcrc = void 0;
const devkit_1 = require("@nx/devkit");
function generateTmpSwcrc(inlineProjectGraph, swcrcPath) {
    const swcrc = (0, devkit_1.readJsonFile)(swcrcPath);
    swcrc['exclude'] = swcrc['exclude'].concat(Object.values(inlineProjectGraph.externals).map((external) => `${external.root}/**/.*.ts$`), 'node_modules/**/*.ts$');
    const tmpSwcrcPath = `tmp${swcrcPath}`;
    (0, devkit_1.writeJsonFile)(tmpSwcrcPath, swcrc);
    return tmpSwcrcPath;
}
exports.generateTmpSwcrc = generateTmpSwcrc;
