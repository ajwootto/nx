"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const executor_options_utils_1 = require("@nx/devkit/src/generators/executor-options-utils");
const tsquery_1 = require("@phenomnomnominal/tsquery");
function default_1(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let changesMade = false;
        const projects = (0, devkit_1.getProjects)(tree);
        (0, executor_options_utils_1.forEachExecutorOptions)(tree, '@nrwl/js:swc', (_, projectName, target, configurationName) => {
            const projectConfiguration = projects.get(projectName);
            const executorOptions = configurationName
                ? projectConfiguration.targets[target].configurations[configurationName]
                : projectConfiguration.targets[target].options;
            // if the project uses a custom path to swcrc file
            // and only if it's the default name
            if (executorOptions.swcrc &&
                executorOptions.swcrc.includes('.lib.swcrc')) {
                const newSwcrc = executorOptions.swcrc.replace('.lib.swcrc', '.swcrc');
                // rename the swcrc file first
                tree.rename(executorOptions.swcrc, newSwcrc);
                // then update the executor options
                executorOptions.swcrc = newSwcrc;
                changesMade = true;
            }
            const libSwcrcPath = (0, devkit_1.joinPathFragments)(projectConfiguration.root, '.lib.swcrc') ||
                (0, devkit_1.joinPathFragments)(projectConfiguration.sourceRoot, '.lib.swcrc');
            const isLibSwcrcExist = tree.exists(libSwcrcPath);
            if (isLibSwcrcExist) {
                tree.rename(libSwcrcPath, libSwcrcPath.replace('.lib.swcrc', '.swcrc'));
                changesMade = true;
            }
            (0, devkit_1.updateProjectConfiguration)(tree, projectName, projectConfiguration);
        });
        (0, executor_options_utils_1.forEachExecutorOptions)(tree, '@nrwl/jest:jest', (_, projectName, target, configurationName) => {
            const projectConfiguration = projects.get(projectName);
            const executorOptions = configurationName
                ? projectConfiguration.targets[target].configurations[configurationName]
                : projectConfiguration.targets[target].options;
            const isJestConfigExist = executorOptions.jestConfig && tree.exists(executorOptions.jestConfig);
            if (isJestConfigExist) {
                const jestConfig = tree.read(executorOptions.jestConfig, 'utf-8');
                const jsonParseNodes = tsquery_1.tsquery.query(jestConfig, ':matches(CallExpression:has(Identifier[name="JSON"]):has(Identifier[name="parse"]))');
                if (jsonParseNodes.length) {
                    // if we already assign false to swcrc, skip
                    if (jestConfig.includes('.swcrc = false')) {
                        return;
                    }
                    let updatedJestConfig = tsquery_1.tsquery.replace(jestConfig, 'CallExpression:has(Identifier[name="JSON"]):has(Identifier[name="parse"]) TemplateSpan', (templateSpan) => {
                        if (templateSpan.literal.text === '/.lib.swcrc') {
                            return templateSpan
                                .getFullText()
                                .replace('.lib.swcrc', '.swcrc');
                        }
                        return '';
                    });
                    updatedJestConfig = tsquery_1.tsquery.replace(updatedJestConfig, ':matches(ExportAssignment, BinaryExpression:has(Identifier[name="module"]):has(Identifier[name="exports"]))', (node) => {
                        return `

// disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves.
// If we do not disable this, SWC Core will read .swcrc and won't transform our test files due to "exclude"
if (swcJestConfig.swcrc === undefined) {
  swcJestConfig.swcrc = false;
}

${node.getFullText()}
`;
                    });
                    tree.write(executorOptions.jestConfig, updatedJestConfig);
                    changesMade = true;
                }
            }
        });
        if (changesMade) {
            yield (0, devkit_1.formatFiles)(tree);
        }
    });
}
exports.default = default_1;
