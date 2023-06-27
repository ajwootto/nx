"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileSwcWatch = exports.compileSwc = void 0;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const child_process_1 = require("child_process");
const fs_extra_1 = require("fs-extra");
const async_iterable_1 = require("@nx/devkit/src/utils/async-iterable");
const print_diagnostics_1 = require("../typescript/print-diagnostics");
const run_type_check_1 = require("../typescript/run-type-check");
function getSwcCmd({ swcrcPath, srcPath, destPath }, watch = false) {
    let swcCmd = `npx swc ${
    // TODO(jack): clean this up when we remove inline module support
    // Handle root project
    srcPath === '.' ? 'src' : srcPath} -d ${destPath} --config-file=${swcrcPath}`;
    return watch ? swcCmd.concat(' --watch') : swcCmd;
}
function getTypeCheckOptions(normalizedOptions) {
    const { projectRoot, watch, tsConfig, root, outputPath } = normalizedOptions;
    const typeCheckOptions = {
        mode: 'emitDeclarationOnly',
        tsConfigPath: tsConfig,
        outDir: outputPath,
        workspaceRoot: root,
        rootDir: projectRoot,
    };
    if (watch) {
        typeCheckOptions.incremental = true;
        typeCheckOptions.cacheDir = devkit_1.cacheDir;
    }
    return typeCheckOptions;
}
function compileSwc(context, normalizedOptions, postCompilationCallback) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const isRootProject = context.projectGraph.nodes[context.projectName].data.root === '.';
        devkit_1.logger.log(`Compiling with SWC for ${context.projectName}...`);
        if (normalizedOptions.clean) {
            (0, fs_extra_1.removeSync)(normalizedOptions.outputPath);
        }
        const swcCmdLog = (0, child_process_1.execSync)(getSwcCmd(normalizedOptions.swcCliOptions), {
            cwd: normalizedOptions.swcCliOptions.swcCwd,
        }).toString();
        devkit_1.logger.log(swcCmdLog.replace(/\n/, ''));
        const isCompileSuccess = swcCmdLog.includes('Successfully compiled');
        if (normalizedOptions.skipTypeCheck) {
            yield postCompilationCallback();
            return { success: isCompileSuccess };
        }
        const { errors, warnings } = yield (0, run_type_check_1.runTypeCheck)(getTypeCheckOptions(normalizedOptions));
        const hasErrors = errors.length > 0;
        const hasWarnings = warnings.length > 0;
        if (hasErrors || hasWarnings) {
            yield (0, print_diagnostics_1.printDiagnostics)(errors, warnings);
        }
        yield postCompilationCallback();
        return {
            success: !hasErrors && isCompileSuccess,
            outfile: normalizedOptions.mainOutputPath,
        };
    });
}
exports.compileSwc = compileSwc;
function compileSwcWatch(context, normalizedOptions, postCompilationCallback) {
    return tslib_1.__asyncGenerator(this, arguments, function* compileSwcWatch_1() {
        const getResult = (success) => ({
            success,
            outfile: normalizedOptions.mainOutputPath,
        });
        let typeCheckOptions;
        let initialPostCompile = true;
        if (normalizedOptions.clean) {
            (0, fs_extra_1.removeSync)(normalizedOptions.outputPath);
        }
        return yield tslib_1.__await(yield tslib_1.__await(yield* tslib_1.__asyncDelegator(tslib_1.__asyncValues((0, async_iterable_1.createAsyncIterable)(({ next, done }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let processOnExit;
            let stdoutOnData;
            let stderrOnData;
            let watcherOnExit;
            const swcWatcher = (0, child_process_1.exec)(getSwcCmd(normalizedOptions.swcCliOptions, true), { cwd: normalizedOptions.swcCliOptions.swcCwd });
            processOnExit = () => {
                swcWatcher.kill();
                done();
                process.off('SIGINT', processOnExit);
                process.off('SIGTERM', processOnExit);
                process.off('exit', processOnExit);
            };
            stdoutOnData = (data) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                process.stdout.write(data);
                if (!data.startsWith('Watching')) {
                    const swcStatus = data.includes('Successfully');
                    if (initialPostCompile) {
                        yield postCompilationCallback();
                        initialPostCompile = false;
                    }
                    if (normalizedOptions.skipTypeCheck) {
                        next(getResult(swcStatus));
                        return;
                    }
                    if (!typeCheckOptions) {
                        typeCheckOptions = getTypeCheckOptions(normalizedOptions);
                    }
                    const delayed = delay(5000);
                    next(getResult(yield Promise.race([
                        delayed
                            .start()
                            .then(() => ({ tscStatus: false, type: 'timeout' })),
                        (0, run_type_check_1.runTypeCheck)(typeCheckOptions).then(({ errors, warnings }) => {
                            const hasErrors = errors.length > 0;
                            if (hasErrors) {
                                (0, print_diagnostics_1.printDiagnostics)(errors, warnings);
                            }
                            return {
                                tscStatus: !hasErrors,
                                type: 'tsc',
                            };
                        }),
                    ]).then(({ type, tscStatus }) => {
                        if (type === 'tsc') {
                            delayed.cancel();
                            return tscStatus && swcStatus;
                        }
                        return swcStatus;
                    })));
                }
            });
            stderrOnData = (err) => {
                process.stderr.write(err);
                if (err.includes('Debugger attached.')) {
                    return;
                }
                next(getResult(false));
            };
            watcherOnExit = () => {
                done();
                swcWatcher.off('exit', watcherOnExit);
            };
            swcWatcher.stdout.on('data', stdoutOnData);
            swcWatcher.stderr.on('data', stderrOnData);
            process.on('SIGINT', processOnExit);
            process.on('SIGTERM', processOnExit);
            process.on('exit', processOnExit);
            swcWatcher.on('exit', watcherOnExit);
        }))))));
    });
}
exports.compileSwcWatch = compileSwcWatch;
function delay(ms) {
    let timerId = undefined;
    return {
        start() {
            return new Promise((resolve) => {
                timerId = setTimeout(() => {
                    resolve();
                }, ms);
            });
        },
        cancel() {
            if (timerId) {
                clearTimeout(timerId);
                timerId = undefined;
            }
        },
    };
}
