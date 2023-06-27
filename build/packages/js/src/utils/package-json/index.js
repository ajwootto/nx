"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyPackageJson = void 0;
const tslib_1 = require("tslib");
const watch_for_single_file_changes_1 = require("../watch-for-single-file-changes");
const update_package_json_1 = require("./update-package-json");
const check_dependencies_1 = require("../check-dependencies");
function copyPackageJson(_options, context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!context.target.options.tsConfig) {
            throw new Error(`Could not find tsConfig option for "${context.targetName}" target of "${context.projectName}" project. Check that your project configuration is correct.`);
        }
        let { target, dependencies, projectRoot } = (0, check_dependencies_1.checkDependencies)(context, context.target.options.tsConfig);
        const options = Object.assign(Object.assign({}, _options), { projectRoot });
        if (options.extraDependencies) {
            dependencies.push(...options.extraDependencies);
        }
        if (options.overrideDependencies) {
            dependencies = options.overrideDependencies;
        }
        if (options.watch) {
            const dispose = yield (0, watch_for_single_file_changes_1.watchForSingleFileChanges)(context.projectName, options.projectRoot, 'package.json', () => (0, update_package_json_1.updatePackageJson)(options, context, target, dependencies));
            // Copy it once before changes
            (0, update_package_json_1.updatePackageJson)(options, context, target, dependencies);
            return { success: true, stop: dispose };
        }
        else {
            (0, update_package_json_1.updatePackageJson)(options, context, target, dependencies);
            return { success: true };
        }
    });
}
exports.copyPackageJson = copyPackageJson;
