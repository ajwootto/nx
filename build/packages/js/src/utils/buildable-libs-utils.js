"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBuildableProjectPackageJsonDependencies = exports.updatePaths = exports.findMissingBuildDependencies = exports.checkDependentProjectsHaveBeenBuilt = exports.createTmpTsConfig = exports.computeCompilerOptionsPaths = exports.calculateProjectDependencies = void 0;
const path_1 = require("path");
const fileutils_1 = require("nx/src/utils/fileutils");
const devkit_1 = require("@nx/devkit");
const fs_1 = require("fs");
const output_1 = require("nx/src/utils/output");
const operators_1 = require("nx/src/project-graph/operators");
const ts_config_1 = require("./typescript/ts-config");
let tsModule;
function isBuildable(target, node) {
    return (node.data.targets &&
        node.data.targets[target] &&
        node.data.targets[target].executor !== '');
}
function calculateProjectDependencies(projGraph, root, projectName, targetName, configurationName, shallow) {
    const target = projGraph.nodes[projectName];
    // gather the library dependencies
    const nonBuildableDependencies = [];
    const topLevelDependencies = [];
    const collectedDeps = collectDependencies(projectName, projGraph, [], shallow);
    const missing = collectedDeps.reduce((missing, { name: dep }) => {
        const depNode = projGraph.nodes[dep] || projGraph.externalNodes[dep];
        if (!depNode) {
            missing = missing || [];
            missing.push(dep);
        }
        return missing;
    }, null);
    if (missing) {
        throw new Error(`Unable to find ${missing.join(', ')} in project graph.`);
    }
    const dependencies = collectedDeps
        .map(({ name: dep, isTopLevel }) => {
        let project = null;
        const depNode = projGraph.nodes[dep] || projGraph.externalNodes[dep];
        if (depNode.type === 'lib') {
            if (isBuildable(targetName, depNode)) {
                const libPackageJsonPath = (0, path_1.join)(root, depNode.data.root, 'package.json');
                project = {
                    name: (0, fileutils_1.fileExists)(libPackageJsonPath)
                        ? (0, devkit_1.readJsonFile)(libPackageJsonPath).name // i.e. @workspace/mylib
                        : dep,
                    outputs: (0, devkit_1.getOutputsForTargetAndConfiguration)({
                        overrides: {},
                        target: {
                            project: projectName,
                            target: targetName,
                            configuration: configurationName,
                        },
                    }, depNode),
                    node: depNode,
                };
            }
            else {
                nonBuildableDependencies.push(dep);
            }
        }
        else if (depNode.type === 'npm') {
            project = {
                name: depNode.data.packageName,
                outputs: [],
                node: depNode,
            };
        }
        if (project && isTopLevel) {
            topLevelDependencies.push(project);
        }
        return project;
    })
        .filter((x) => !!x);
    dependencies.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
    return {
        target,
        dependencies,
        nonBuildableDependencies,
        topLevelDependencies,
    };
}
exports.calculateProjectDependencies = calculateProjectDependencies;
function collectDependencies(project, projGraph, acc, shallow, areTopLevelDeps = true) {
    (projGraph.dependencies[project] || []).forEach((dependency) => {
        if (!acc.some((dep) => dep.name === dependency.target)) {
            // Temporary skip this. Currently the set of external nodes is built from package.json, not lock file.
            // As a result, some nodes might be missing. This should not cause any issues, we can just skip them.
            if (dependency.target.startsWith('npm:') &&
                !projGraph.externalNodes[dependency.target])
                return;
            acc.push({ name: dependency.target, isTopLevel: areTopLevelDeps });
            const isInternalTarget = projGraph.nodes[dependency.target];
            if (!shallow && isInternalTarget) {
                collectDependencies(dependency.target, projGraph, acc, shallow, false);
            }
        }
    });
    return acc;
}
function readTsConfigWithRemappedPaths(tsConfig, generatedTsConfigPath, dependencies) {
    const generatedTsConfig = { compilerOptions: {} };
    generatedTsConfig.extends = (0, path_1.relative)((0, path_1.dirname)(generatedTsConfigPath), tsConfig);
    generatedTsConfig.compilerOptions.paths = computeCompilerOptionsPaths(tsConfig, dependencies);
    if (process.env.NX_VERBOSE_LOGGING_PATH_MAPPINGS === 'true') {
        output_1.output.log({
            title: 'TypeScript path mappings have been rewritten.',
        });
        console.log(JSON.stringify(generatedTsConfig.compilerOptions.paths, null, 2));
    }
    return generatedTsConfig;
}
/**
 * Util function to create tsconfig compilerOptions object with support for workspace libs paths.
 *
 *
 *
 * @param tsConfig String of config path or object parsed via ts.parseJsonConfigFileContent.
 * @param dependencies Dependencies calculated by Nx.
 */
function computeCompilerOptionsPaths(tsConfig, dependencies) {
    const paths = (0, ts_config_1.readTsConfigPaths)(tsConfig) || {};
    updatePaths(dependencies, paths);
    return paths;
}
exports.computeCompilerOptionsPaths = computeCompilerOptionsPaths;
function createTmpTsConfig(tsconfigPath, workspaceRoot, projectRoot, dependencies) {
    const tmpTsConfigPath = (0, path_1.join)(workspaceRoot, 'tmp', projectRoot, 'tsconfig.generated.json');
    const parsedTSConfig = readTsConfigWithRemappedPaths(tsconfigPath, tmpTsConfigPath, dependencies);
    process.on('exit', () => cleanupTmpTsConfigFile(tmpTsConfigPath));
    (0, devkit_1.writeJsonFile)(tmpTsConfigPath, parsedTSConfig);
    return (0, path_1.join)(tmpTsConfigPath);
}
exports.createTmpTsConfig = createTmpTsConfig;
function cleanupTmpTsConfigFile(tmpTsConfigPath) {
    try {
        if (tmpTsConfigPath) {
            (0, fs_1.unlinkSync)(tmpTsConfigPath);
        }
    }
    catch (e) { }
}
function checkDependentProjectsHaveBeenBuilt(root, projectName, targetName, projectDependencies) {
    const missing = findMissingBuildDependencies(root, projectName, targetName, projectDependencies);
    if (missing.length > 0) {
        console.error((0, devkit_1.stripIndents) `
      It looks like all of ${projectName}'s dependencies have not been built yet:
      ${missing.map((x) => ` - ${x.node.name}`).join('\n')}

      You might be missing a "targetDefaults" configuration in your root nx.json (https://nx.dev/reference/project-configuration#target-defaults),
      or "dependsOn" configured in ${projectName}'s project.json (https://nx.dev/reference/project-configuration#dependson) 
    `);
        return false;
    }
    else {
        return true;
    }
}
exports.checkDependentProjectsHaveBeenBuilt = checkDependentProjectsHaveBeenBuilt;
function findMissingBuildDependencies(root, projectName, targetName, projectDependencies) {
    const depLibsToBuildFirst = [];
    // verify whether all dependent libraries have been built
    projectDependencies.forEach((dep) => {
        if (dep.node.type !== 'lib') {
            return;
        }
        const paths = dep.outputs.map((p) => (0, path_1.join)(root, p));
        if (!paths.some(fileutils_1.directoryExists)) {
            depLibsToBuildFirst.push(dep);
        }
    });
    return depLibsToBuildFirst;
}
exports.findMissingBuildDependencies = findMissingBuildDependencies;
function updatePaths(dependencies, paths) {
    const pathsKeys = Object.keys(paths);
    // For each registered dependency
    dependencies.forEach((dep) => {
        var _a;
        // If there are outputs
        if (dep.outputs && dep.outputs.length > 0) {
            // Directly map the dependency name to the output paths (dist/packages/..., etc.)
            paths[dep.name] = dep.outputs;
            // check for secondary entrypoints
            // For each registered path
            for (const path of pathsKeys) {
                const nestedName = `${dep.name}/`;
                // If the path points to the current dependency and is nested (/)
                if (path.startsWith(nestedName)) {
                    const nestedPart = path.slice(nestedName.length);
                    // Bind secondary endpoints for ng-packagr projects
                    let mappedPaths = dep.outputs.map((output) => `${output}/${nestedPart}`);
                    // Get the dependency's package name
                    const { root } = (((_a = dep.node) === null || _a === void 0 ? void 0 : _a.data) || {});
                    if (root) {
                        // Update nested mappings to point to the dependency's output paths
                        mappedPaths = mappedPaths.concat(paths[path].flatMap((path) => dep.outputs.map((output) => path.replace(root, output))));
                    }
                    paths[path] = mappedPaths;
                }
            }
        }
    });
}
exports.updatePaths = updatePaths;
/**
 * Updates the peerDependencies section in the `dist/lib/xyz/package.json` with
 * the proper dependency and version
 */
function updateBuildableProjectPackageJsonDependencies(root, projectName, targetName, configurationName, node, dependencies, typeOfDependency = 'dependencies') {
    const outputs = (0, devkit_1.getOutputsForTargetAndConfiguration)({
        overrides: {},
        target: {
            project: projectName,
            target: targetName,
            configuration: configurationName,
        },
    }, node);
    const packageJsonPath = `${outputs[0]}/package.json`;
    let packageJson;
    let workspacePackageJson;
    try {
        packageJson = (0, devkit_1.readJsonFile)(packageJsonPath);
        workspacePackageJson = (0, devkit_1.readJsonFile)(`${root}/package.json`);
    }
    catch (e) {
        // cannot find or invalid package.json
        return;
    }
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.peerDependencies = packageJson.peerDependencies || {};
    let updatePackageJson = false;
    dependencies.forEach((entry) => {
        var _a;
        const packageName = (0, operators_1.isNpmProject)(entry.node)
            ? entry.node.data.packageName
            : entry.name;
        if (!hasDependency(packageJson, 'dependencies', packageName) &&
            !hasDependency(packageJson, 'devDependencies', packageName) &&
            !hasDependency(packageJson, 'peerDependencies', packageName)) {
            try {
                let depVersion;
                if (entry.node.type === 'lib') {
                    const outputs = (0, devkit_1.getOutputsForTargetAndConfiguration)({
                        overrides: {},
                        target: {
                            project: projectName,
                            target: targetName,
                            configuration: configurationName,
                        },
                    }, entry.node);
                    const depPackageJsonPath = (0, path_1.join)(root, outputs[0], 'package.json');
                    depVersion = (0, devkit_1.readJsonFile)(depPackageJsonPath).version;
                    packageJson[typeOfDependency][packageName] = depVersion;
                }
                else if ((0, operators_1.isNpmProject)(entry.node)) {
                    // If an npm dep is part of the workspace devDependencies, do not include it the library
                    if (!!((_a = workspacePackageJson.devDependencies) === null || _a === void 0 ? void 0 : _a[entry.node.data.packageName])) {
                        return;
                    }
                    depVersion = entry.node.data.version;
                    packageJson[typeOfDependency][entry.node.data.packageName] =
                        depVersion;
                }
                updatePackageJson = true;
            }
            catch (e) {
                // skip if cannot find package.json
            }
        }
    });
    if (updatePackageJson) {
        (0, devkit_1.writeJsonFile)(packageJsonPath, packageJson);
    }
}
exports.updateBuildableProjectPackageJsonDependencies = updateBuildableProjectPackageJsonDependencies;
// verify whether the package.json already specifies the dep
function hasDependency(outputJson, depConfigName, packageName) {
    if (outputJson[depConfigName]) {
        return outputJson[depConfigName][packageName];
    }
    else {
        return false;
    }
}
