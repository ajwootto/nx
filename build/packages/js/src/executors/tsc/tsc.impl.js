"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tscExecutor = exports.createTypeScriptCompilationOptions = exports.normalizeOptions = void 0;
const tslib_1 = require("tslib");
const assets_1 = require("../../utils/assets/assets");
const path_1 = require("path");
const copy_assets_handler_1 = require("../../utils/assets/copy-assets-handler");
const check_dependencies_1 = require("../../utils/check-dependencies");
const compiler_helper_dependency_1 = require("../../utils/compiler-helper-dependency");
const inline_1 = require("../../utils/inline");
const update_package_json_1 = require("../../utils/package-json/update-package-json");
const compile_typescript_files_1 = require("../../utils/typescript/compile-typescript-files");
const load_ts_transformers_1 = require("../../utils/typescript/load-ts-transformers");
const watch_for_single_file_changes_1 = require("../../utils/watch-for-single-file-changes");
function normalizeOptions(options, contextRoot, sourceRoot, projectRoot) {
    const outputPath = (0, path_1.join)(contextRoot, options.outputPath);
    const rootDir = options.rootDir
        ? (0, path_1.join)(contextRoot, options.rootDir)
        : projectRoot;
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
    return Object.assign(Object.assign({}, options), { root: contextRoot, sourceRoot,
        projectRoot,
        files,
        outputPath, tsConfig: (0, path_1.join)(contextRoot, options.tsConfig), rootDir, mainOutputPath: (0, path_1.resolve)(outputPath, options.main.replace(`${projectRoot}/`, '').replace('.ts', '.js')) });
}
exports.normalizeOptions = normalizeOptions;
function createTypeScriptCompilationOptions(normalizedOptions, context) {
    const { compilerPluginHooks } = (0, load_ts_transformers_1.loadTsTransformers)(normalizedOptions.transformers);
    const getCustomTransformers = (program) => ({
        before: compilerPluginHooks.beforeHooks.map((hook) => hook(program)),
        after: compilerPluginHooks.afterHooks.map((hook) => hook(program)),
        afterDeclarations: compilerPluginHooks.afterDeclarationsHooks.map((hook) => hook(program)),
    });
    return {
        outputPath: normalizedOptions.outputPath,
        projectName: context.projectName,
        projectRoot: normalizedOptions.projectRoot,
        rootDir: normalizedOptions.rootDir,
        tsConfig: normalizedOptions.tsConfig,
        watch: normalizedOptions.watch,
        deleteOutputPath: normalizedOptions.clean,
        getCustomTransformers,
    };
}
exports.createTypeScriptCompilationOptions = createTypeScriptCompilationOptions;
function tscExecutor(_options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* tscExecutor_1() {
        const { sourceRoot, root } = context.projectsConfigurations.projects[context.projectName];
        const options = normalizeOptions(_options, context.root, sourceRoot, root);
        const { projectRoot, tmpTsConfig, target, dependencies } = (0, check_dependencies_1.checkDependencies)(context, _options.tsConfig);
        if (tmpTsConfig) {
            options.tsConfig = tmpTsConfig;
        }
        const tsLibDependency = (0, compiler_helper_dependency_1.getHelperDependency)(compiler_helper_dependency_1.HelperDependency.tsc, options.tsConfig, dependencies, context.projectGraph);
        if (tsLibDependency) {
            dependencies.push(tsLibDependency);
        }
        const assetHandler = new copy_assets_handler_1.CopyAssetsHandler({
            projectDir: projectRoot,
            rootDir: context.root,
            outputDir: _options.outputPath,
            assets: _options.assets,
        });
        const tsCompilationOptions = createTypeScriptCompilationOptions(options, context);
        const inlineProjectGraph = (0, inline_1.handleInliningBuild)(context, options, tsCompilationOptions.tsConfig);
        if (!(0, inline_1.isInlineGraphEmpty)(inlineProjectGraph)) {
            tsCompilationOptions.rootDir = '.';
        }
        const typescriptCompilation = (0, compile_typescript_files_1.compileTypeScriptFiles)(options, tsCompilationOptions, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield assetHandler.processAllAssetsOnce();
            (0, update_package_json_1.updatePackageJson)(options, context, target, dependencies);
            (0, inline_1.postProcessInlinedDependencies)(tsCompilationOptions.outputPath, tsCompilationOptions.projectRoot, inlineProjectGraph);
        }));
        if (options.watch) {
            const disposeWatchAssetChanges = yield tslib_1.__await(assetHandler.watchAndProcessOnAssetChange());
            const disposePackageJsonChanges = yield tslib_1.__await((0, watch_for_single_file_changes_1.watchForSingleFileChanges)(context.projectName, options.projectRoot, 'package.json', () => (0, update_package_json_1.updatePackageJson)(options, context, target, dependencies)));
            const handleTermination = (exitCode) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield typescriptCompilation.close();
                disposeWatchAssetChanges();
                disposePackageJsonChanges();
                process.exit(exitCode);
            });
            process.on('SIGINT', () => handleTermination(128 + 2));
            process.on('SIGTERM', () => handleTermination(128 + 15));
        }
        return yield tslib_1.__await(yield tslib_1.__await(yield* tslib_1.__asyncDelegator(tslib_1.__asyncValues(typescriptCompilation.iterator))));
    });
}
exports.tscExecutor = tscExecutor;
exports.default = tscExecutor;
