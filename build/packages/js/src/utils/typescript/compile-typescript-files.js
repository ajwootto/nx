"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileTypeScriptFiles = void 0;
const tslib_1 = require("tslib");
const compilation_1 = require("@nx/workspace/src/utilities/typescript/compilation");
const async_iterable_1 = require("@nx/devkit/src/utils/async-iterable");
const TYPESCRIPT_FOUND_N_ERRORS_WATCHING_FOR_FILE_CHANGES = 6194;
// Typescript diagnostic message for 6194: Found {0} errors. Watching for file changes.
// https://github.com/microsoft/TypeScript/blob/d45012c5e2ab122919ee4777a7887307c5f4a1e0/src/compiler/diagnosticMessages.json#L4763-L4766
const ERROR_COUNT_REGEX = /Found (\d+) errors/;
function getErrorCountFromMessage(messageText) {
    return Number.parseInt(ERROR_COUNT_REGEX.exec(messageText)[1]);
}
function compileTypeScriptFiles(normalizedOptions, tscOptions, postCompilationCallback) {
    const getResult = (success) => ({
        success,
        outfile: normalizedOptions.mainOutputPath,
    });
    let tearDown;
    return {
        iterator: (0, async_iterable_1.createAsyncIterable)(({ next, done }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (normalizedOptions.watch) {
                const host = (0, compilation_1.compileTypeScriptWatcher)(tscOptions, (d) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (d.code === TYPESCRIPT_FOUND_N_ERRORS_WATCHING_FOR_FILE_CHANGES) {
                        yield postCompilationCallback();
                        next(getResult(getErrorCountFromMessage(d.messageText) === 0));
                    }
                }));
                tearDown = () => {
                    host.close();
                    done();
                };
            }
            else {
                const { success } = (0, compilation_1.compileTypeScript)(tscOptions);
                yield postCompilationCallback();
                next(getResult(success));
                done();
            }
        })),
        close: () => tearDown === null || tearDown === void 0 ? void 0 : tearDown(),
    };
}
exports.compileTypeScriptFiles = compileTypeScriptFiles;
