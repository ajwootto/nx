"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTsLibDependencies = void 0;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("../versions");
function addTsLibDependencies(tree) {
    return (0, devkit_1.addDependenciesToPackageJson)(tree, {
        tslib: versions_1.tsLibVersion,
    }, {});
}
exports.addTsLibDependencies = addTsLibDependencies;
