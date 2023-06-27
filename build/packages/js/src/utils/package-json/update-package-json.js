"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdatedPackageJsonContent = exports.updatePackageJson = void 0;
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
const lock_file_1 = require("nx/src/plugins/js/lock-file/lock-file");
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
const create_package_json_1 = require("nx/src/plugins/js/package-json/create-package-json");
const devkit_1 = require("@nx/devkit");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const operators_1 = require("nx/src/project-graph/operators");
const fileutils_1 = require("nx/src/utils/fileutils");
const fs_1 = require("fs");
const nx_deps_cache_1 = require("nx/src/project-graph/nx-deps-cache");
function getMainFileDirRelativeToProjectRoot(main, projectRoot) {
    const mainFileDir = (0, path_1.dirname)(main);
    const relativeDir = (0, devkit_1.normalizePath)((0, path_1.relative)(projectRoot, mainFileDir));
    return relativeDir === '' ? `./` : `./${relativeDir}/`;
}
function updatePackageJson(options, context, target, dependencies, fileMap = null) {
    var _a;
    let packageJson;
    if (fileMap == null) {
        fileMap = ((_a = (0, nx_deps_cache_1.readProjectFileMapCache)()) === null || _a === void 0 ? void 0 : _a.projectFileMap) || {};
    }
    if (options.updateBuildableProjectDepsInPackageJson) {
        packageJson = (0, create_package_json_1.createPackageJson)(context.projectName, context.projectGraph, {
            target: context.targetName,
            root: context.root,
            // By default we remove devDependencies since this is a production build.
            isProduction: true,
        }, fileMap);
        if (options.excludeLibsInPackageJson) {
            dependencies = dependencies.filter((dep) => dep.node.type !== 'lib');
        }
        addMissingDependencies(packageJson, context, dependencies, options.buildableProjectDepsInPackageJsonType);
    }
    else {
        const pathToPackageJson = (0, path_1.join)(context.root, options.projectRoot, 'package.json');
        packageJson = (0, fileutils_1.fileExists)(pathToPackageJson)
            ? (0, devkit_1.readJsonFile)(pathToPackageJson)
            : { name: context.projectName, version: '0.0.1' };
    }
    // update package specific settings
    packageJson = getUpdatedPackageJsonContent(packageJson, options);
    // save files
    (0, devkit_1.writeJsonFile)(`${options.outputPath}/package.json`, packageJson);
    if (options.generateLockfile) {
        const lockFile = (0, lock_file_1.createLockFile)(packageJson);
        (0, fs_extra_1.writeFileSync)(`${options.outputPath}/${(0, lock_file_1.getLockFileName)()}`, lockFile, {
            encoding: 'utf-8',
        });
    }
}
exports.updatePackageJson = updatePackageJson;
function addMissingDependencies(packageJson, { projectName, targetName, configurationName, root }, dependencies, propType = 'dependencies') {
    const workspacePackageJson = (0, devkit_1.readJsonFile)((0, devkit_1.joinPathFragments)(devkit_1.workspaceRoot, 'package.json'));
    dependencies.forEach((entry) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if ((0, operators_1.isNpmProject)(entry.node)) {
            const { packageName, version } = entry.node.data;
            if (((_a = packageJson.dependencies) === null || _a === void 0 ? void 0 : _a[packageName]) ||
                ((_b = packageJson.devDependencies) === null || _b === void 0 ? void 0 : _b[packageName]) ||
                ((_c = packageJson.peerDependencies) === null || _c === void 0 ? void 0 : _c[packageName])) {
                return;
            }
            if ((_d = workspacePackageJson.devDependencies) === null || _d === void 0 ? void 0 : _d[packageName]) {
                return;
            }
            (_e = packageJson[propType]) !== null && _e !== void 0 ? _e : (packageJson[propType] = {});
            packageJson[propType][packageName] = version;
        }
        else {
            const packageName = entry.name;
            if (!!((_f = workspacePackageJson.devDependencies) === null || _f === void 0 ? void 0 : _f[packageName])) {
                return;
            }
            if (!((_g = packageJson.dependencies) === null || _g === void 0 ? void 0 : _g[packageName]) &&
                !((_h = packageJson.peerDependencies) === null || _h === void 0 ? void 0 : _h[packageName])) {
                const outputs = (0, devkit_1.getOutputsForTargetAndConfiguration)({
                    overrides: {},
                    target: {
                        project: projectName,
                        target: targetName,
                        configuration: configurationName,
                    },
                }, entry.node);
                const depPackageJsonPath = (0, path_1.join)(root, outputs[0], 'package.json');
                if ((0, fs_1.existsSync)(depPackageJsonPath)) {
                    const version = (0, devkit_1.readJsonFile)(depPackageJsonPath).version;
                    (_j = packageJson[propType]) !== null && _j !== void 0 ? _j : (packageJson[propType] = {});
                    packageJson[propType][packageName] = version;
                }
            }
        }
    });
}
function getUpdatedPackageJsonContent(packageJson, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    var _o, _p;
    // Default is CJS unless esm is explicitly passed.
    const hasCjsFormat = !options.format || ((_a = options.format) === null || _a === void 0 ? void 0 : _a.includes('cjs'));
    const hasEsmFormat = (_b = options.format) === null || _b === void 0 ? void 0 : _b.includes('esm');
    const mainFile = (0, path_1.basename)(options.main).replace(/\.[tj]s$/, '');
    const relativeMainFileDir = getMainFileDirRelativeToProjectRoot(options.main, options.projectRoot);
    const typingsFile = `${relativeMainFileDir}${mainFile}.d.ts`;
    const exports = typeof packageJson.exports === 'string'
        ? packageJson.exports
        : Object.assign({ '.': {} }, packageJson.exports);
    const mainJsFile = (_c = options.outputFileName) !== null && _c !== void 0 ? _c : `${relativeMainFileDir}${mainFile}.js`;
    if (hasEsmFormat) {
        // Unofficial field for backwards compat.
        (_d = packageJson.module) !== null && _d !== void 0 ? _d : (packageJson.module = mainJsFile);
        if (!hasCjsFormat) {
            packageJson.type = 'module';
            (_e = packageJson.main) !== null && _e !== void 0 ? _e : (packageJson.main = mainJsFile);
        }
        if (typeof exports !== 'string') {
            if (typeof exports['.'] !== 'string') {
                (_f = (_o = exports['.'])['import']) !== null && _f !== void 0 ? _f : (_o['import'] = mainJsFile);
            }
            else if (!hasCjsFormat) {
                (_g = exports['.']) !== null && _g !== void 0 ? _g : (exports['.'] = mainJsFile);
            }
        }
    }
    // CJS output may have .cjs or .js file extensions.
    // Bundlers like rollup and esbuild supports .cjs for CJS and .js for ESM.
    // Bundlers/Compilers like webpack, tsc, swc do not have different file extensions.
    if (hasCjsFormat) {
        const { dir, name } = (0, path_1.parse)(mainJsFile);
        const cjsMain = `${dir ? dir : '.'}/${name}${(_h = options.outputFileExtensionForCjs) !== null && _h !== void 0 ? _h : '.js'}`;
        (_j = packageJson.main) !== null && _j !== void 0 ? _j : (packageJson.main = cjsMain);
        if (typeof exports !== 'string') {
            if (typeof exports['.'] !== 'string') {
                (_k = (_p = exports['.'])['require']) !== null && _k !== void 0 ? _k : (_p['require'] = cjsMain);
            }
            else if (!hasEsmFormat) {
                (_l = exports['.']) !== null && _l !== void 0 ? _l : (exports['.'] = cjsMain);
            }
        }
    }
    if (options.generateExportsField) {
        packageJson.exports = exports;
    }
    if (!options.skipTypings) {
        packageJson.types = (_m = packageJson.types) !== null && _m !== void 0 ? _m : typingsFile;
    }
    return packageJson;
}
exports.getUpdatedPackageJsonContent = getUpdatedPackageJsonContent;
