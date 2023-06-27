"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
module.exports = function (api, options = {}) {
    var _a, _b, _c;
    api.assertVersion(7);
    const isModern = api.caller((caller) => caller === null || caller === void 0 ? void 0 : caller.isModern);
    // This is set by `@nx/rollup:rollup` executor
    const isNxPackage = api.caller((caller) => caller === null || caller === void 0 ? void 0 : caller.isNxPackage);
    const emitDecoratorMetadata = api.caller((caller) => { var _a; return (_a = caller === null || caller === void 0 ? void 0 : caller.emitDecoratorMetadata) !== null && _a !== void 0 ? _a : true; });
    // Determine settings  for `@babel/plugin-proposal-class-properties`,
    // so that we can sync the `loose` option with `@babel/preset-env`.
    const classProperties = (_a = options.classProperties) !== null && _a !== void 0 ? _a : { loose: true };
    return {
        presets: [
            // Support module/nomodule pattern.
            [
                require.resolve('@babel/preset-env'),
                // For Jest tests, NODE_ENV is set as 'test' and we only want to set target as Node.
                // All other options will fail in Jest since Node does not support some ES features
                // such as import syntax.
                process.env.NODE_ENV === 'test'
                    ? { targets: { node: 'current' }, loose: true }
                    : {
                        // Allow importing core-js in entrypoint and use browserslist to select polyfills.
                        useBuiltIns: (_b = options.useBuiltIns) !== null && _b !== void 0 ? _b : 'entry',
                        corejs: 3,
                        // Do not transform modules to CJS
                        modules: false,
                        targets: isModern ? { esmodules: 'intersect' } : undefined,
                        bugfixes: true,
                        // Exclude transforms that make all code slower
                        exclude: ['transform-typeof-symbol'],
                        // This must match the setting for `@babel/plugin-proposal-class-properties`
                        loose: classProperties.loose,
                    },
            ],
            [
                require.resolve('@babel/preset-typescript'),
                {
                    allowDeclareFields: true,
                },
            ],
        ],
        plugins: [
            !isNxPackage
                ? [
                    require.resolve('@babel/plugin-transform-runtime'),
                    {
                        corejs: false,
                        helpers: true,
                        regenerator: true,
                        useESModules: isModern,
                        absoluteRuntime: (0, path_1.dirname)(require.resolve('@babel/runtime/package.json')),
                    },
                ]
                : null,
            require.resolve('babel-plugin-macros'),
            emitDecoratorMetadata
                ? require.resolve('babel-plugin-transform-typescript-metadata')
                : undefined,
            // Must use legacy decorators to remain compatible with TypeScript.
            [
                require.resolve('@babel/plugin-proposal-decorators'),
                (_c = options.decorators) !== null && _c !== void 0 ? _c : { legacy: true },
            ],
            [
                require.resolve('@babel/plugin-proposal-class-properties'),
                classProperties,
            ],
        ].filter(Boolean),
        overrides: [
            // Convert `const enum` to `enum`. The former cannot be supported by babel
            // but at least we can get it to not error out.
            {
                test: /\.tsx?$/,
                plugins: [
                    [
                        require.resolve('babel-plugin-const-enum'),
                        {
                            transform: 'removeConst',
                        },
                    ],
                ],
            },
        ],
    };
};
