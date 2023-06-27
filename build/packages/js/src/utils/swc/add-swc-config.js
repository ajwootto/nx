"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSwcConfig = exports.defaultExclude = void 0;
const path_1 = require("path");
exports.defaultExclude = [
    'jest.config.ts',
    '.*\\.spec.tsx?$',
    '.*\\.test.tsx?$',
    './src/jest-setup.ts$',
    './**/jest-setup.ts$',
    '.*.js$',
];
const swcOptionsString = (type = 'commonjs') => `{
  "jsc": {
    "target": "es2017",
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "decoratorMetadata": true,
      "legacyDecorator": true
    },
    "keepClassNames": true,
    "externalHelpers": true,
    "loose": true
  },
  "module": {
    "type": "${type}",
    "strict": true,
    "noInterop": true
  },
  "sourceMaps": true,
  "exclude": ${JSON.stringify(exports.defaultExclude)}
}`;
function addSwcConfig(tree, projectDir, type = 'commonjs') {
    const swcrcPath = (0, path_1.join)(projectDir, '.swcrc');
    if (tree.exists(swcrcPath))
        return;
    tree.write(swcrcPath, swcOptionsString(type));
}
exports.addSwcConfig = addSwcConfig;
