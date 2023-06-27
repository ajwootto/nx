"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swcExecutor = exports.normalizeOptions = void 0;
const tslib_1 = require("tslib");
const assets_1 = require("../../utils/assets/assets");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const assets_2 = require("../../utils/assets");
const check_dependencies_1 = require("../../utils/check-dependencies");
const compiler_helper_dependency_1 = require("../../utils/compiler-helper-dependency");
const inline_1 = require("../../utils/inline");
const package_json_1 = require("../../utils/package-json");
const compile_swc_1 = require("../../utils/swc/compile-swc");
const get_swcrc_path_1 = require("../../utils/swc/get-swcrc-path");
const inline_2 = require("../../utils/swc/inline");
function normalizeOptions(options, contextRoot, sourceRoot, projectRoot) {
    const outputPath = (0, path_1.join)(contextRoot, options.outputPath);
    if (options.skipTypeCheck == null) {
        options.skipTypeCheck = false;
    }
    if (options.watch == null) {
        options.watch = false;
    }
    // TODO: put back when inlining story is more stable
    // if (options.external == null) {
    //   options.external = 'all';
    // } else if (Array.isArray(options.external) && options.external.length === 0) {
    //   options.external = 'none';
    // }
    if (Array.isArray(options.external) && options.external.length > 0) {
        const firstItem = options.external[0];
        if (firstItem === 'all' || firstItem === 'none') {
            options.external = firstItem;
        }
    }
    const files = (0, assets_1.assetGlobsToFiles)(options.assets, contextRoot, outputPath);
    const projectRootParts = projectRoot.split('/');
    // We pop the last part of the `projectRoot` to pass
    // the last part (projectDir) and the remainder (projectRootParts) to swc
    const projectDir = projectRootParts.pop();
    // default to current directory if projectRootParts is [].
    // Eg: when a project is at the root level, outside of layout dir
    const swcCwd = projectRootParts.join('/') || '.';
    const swcrcPath = (0, get_swcrc_path_1.getSwcrcPath)(options, contextRoot, projectRoot);
    const swcCliOptions = {
        srcPath: projectDir,
        destPath: (0, path_1.relative)((0, path_1.join)(contextRoot, swcCwd), outputPath),
        swcCwd,
        swcrcPath,
    };
    return Object.assign(Object.assign({}, options), { mainOutputPath: (0, path_1.resolve)(outputPath, options.main.replace(`${projectRoot}/`, '').replace('.ts', '.js')), files, root: contextRoot, sourceRoot,
        projectRoot, originalProjectRoot: projectRoot, outputPath, tsConfig: (0, path_1.join)(contextRoot, options.tsConfig), swcCliOptions });
}
exports.normalizeOptions = normalizeOptions;
function swcExecutor(_options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* swcExecutor_1() {
        const { sourceRoot, root } = context.projectsConfigurations.projects[context.projectName];
        const options = normalizeOptions(_options, context.root, sourceRoot, root);
        const { tmpTsConfig, dependencies } = (0, check_dependencies_1.checkDependencies)(context, options.tsConfig);
        if (tmpTsConfig) {
            options.tsConfig = tmpTsConfig;
        }
        const swcHelperDependency = (0, compiler_helper_dependency_1.getHelperDependency)(compiler_helper_dependency_1.HelperDependency.swc, options.swcCliOptions.swcrcPath, dependencies, context.projectGraph);
        if (swcHelperDependency) {
            dependencies.push(swcHelperDependency);
        }
        const inlineProjectGraph = (0, inline_1.handleInliningBuild)(context, options, options.tsConfig);
        if (!(0, inline_1.isInlineGraphEmpty)(inlineProjectGraph)) {
            options.projectRoot = '.'; // set to root of workspace to include other libs for type check
            // remap paths for SWC compilation
            options.swcCliOptions.srcPath = options.swcCliOptions.swcCwd;
            options.swcCliOptions.swcCwd = '.';
            options.swcCliOptions.destPath = options.swcCliOptions.destPath
                .split('../')
                .at(-1)
                .concat('/', options.swcCliOptions.srcPath);
            // tmp swcrc with dependencies to exclude
            // - buildable libraries
            // - other libraries that are not dependent on the current project
            options.swcCliOptions.swcrcPath = (0, inline_2.generateTmpSwcrc)(inlineProjectGraph, options.swcCliOptions.swcrcPath);
        }
        if (options.watch) {
            let disposeFn;
            process.on('SIGINT', () => disposeFn());
            process.on('SIGTERM', () => disposeFn());
            return yield tslib_1.__await(yield tslib_1.__await(yield* tslib_1.__asyncDelegator(tslib_1.__asyncValues((0, compile_swc_1.compileSwcWatch)(context, options, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const assetResult = yield (0, assets_2.copyAssets)(options, context);
                const packageJsonResult = yield (0, package_json_1.copyPackageJson)(Object.assign(Object.assign({}, options), { skipTypings: !options.skipTypeCheck }), context);
                removeTmpSwcrc(options.swcCliOptions.swcrcPath);
                disposeFn = () => {
                    assetResult === null || assetResult === void 0 ? void 0 : assetResult.stop();
                    packageJsonResult === null || packageJsonResult === void 0 ? void 0 : packageJsonResult.stop();
                };
            }))))));
        }
        else {
            return yield tslib_1.__await(yield yield tslib_1.__await((0, compile_swc_1.compileSwc)(context, options, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield (0, assets_2.copyAssets)(options, context);
                yield (0, package_json_1.copyPackageJson)(Object.assign(Object.assign({}, options), { generateExportsField: true, skipTypings: !options.skipTypeCheck, extraDependencies: swcHelperDependency ? [swcHelperDependency] : [] }), context);
                removeTmpSwcrc(options.swcCliOptions.swcrcPath);
                (0, inline_1.postProcessInlinedDependencies)(options.outputPath, options.originalProjectRoot, inlineProjectGraph);
            }))));
        }
    });
}
exports.swcExecutor = swcExecutor;
function removeTmpSwcrc(swcrcPath) {
    if (swcrcPath.includes('tmp/') && swcrcPath.includes('.generated.swcrc')) {
        (0, fs_extra_1.removeSync)((0, path_1.dirname)(swcrcPath));
    }
}
exports.default = swcExecutor;
