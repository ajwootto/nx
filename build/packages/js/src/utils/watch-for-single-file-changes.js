"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.watchForSingleFileChanges = void 0;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const client_1 = require("nx/src/daemon/client/client");
const path_1 = require("path");
function watchForSingleFileChanges(projectName, projectRoot, relativeFilePath, callback) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const unregisterFileWatcher = yield client_1.daemonClient.registerFileWatcher({ watchProjects: [projectName] }, (err, data) => {
            var _a;
            if (err === 'closed') {
                devkit_1.logger.error(`Watch error: Daemon closed the connection`);
                process.exit(1);
            }
            else if (err) {
                devkit_1.logger.error(`Watch error: ${(_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : 'Unknown'}`);
            }
            else if (data.changedFiles.some((file) => file.path == (0, path_1.join)(projectRoot, relativeFilePath))) {
                callback();
            }
        });
        return () => unregisterFileWatcher();
    });
}
exports.watchForSingleFileChanges = watchForSingleFileChanges;
