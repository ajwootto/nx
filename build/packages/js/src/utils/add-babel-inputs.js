"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBabelInputs = void 0;
const devkit_1 = require("@nx/devkit");
function addBabelInputs(tree) {
    var _a;
    const nxJson = (0, devkit_1.readNxJson)(tree);
    let globalBabelFile = ['babel.config.js', 'babel.config.json'].find((file) => tree.exists(file));
    if (!globalBabelFile) {
        (0, devkit_1.writeJson)(tree, '/babel.config.json', {
            babelrcRoots: ['*'], // Make sure .babelrc files other than root can be loaded in a monorepo
        });
        globalBabelFile = 'babel.config.json';
    }
    if ((_a = nxJson.namedInputs) === null || _a === void 0 ? void 0 : _a.sharedGlobals) {
        const sharedGlobalFileset = new Set(nxJson.namedInputs.sharedGlobals);
        sharedGlobalFileset.add((0, devkit_1.joinPathFragments)('{workspaceRoot}', globalBabelFile));
        nxJson.namedInputs.sharedGlobals = Array.from(sharedGlobalFileset);
    }
    (0, devkit_1.updateNxJson)(tree, nxJson);
}
exports.addBabelInputs = addBabelInputs;
