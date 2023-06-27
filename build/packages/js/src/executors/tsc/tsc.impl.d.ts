import { ExecutorContext } from '@nx/devkit';
import type { TypeScriptCompilationOptions } from '@nx/workspace/src/utilities/typescript/compilation';
import { ExecutorOptions, NormalizedExecutorOptions } from '../../utils/schema';
export declare function normalizeOptions(options: ExecutorOptions, contextRoot: string, sourceRoot: string, projectRoot: string): NormalizedExecutorOptions;
export declare function createTypeScriptCompilationOptions(normalizedOptions: NormalizedExecutorOptions, context: ExecutorContext): TypeScriptCompilationOptions;
export declare function tscExecutor(_options: ExecutorOptions, context: ExecutorContext): AsyncGenerator<import("../../utils/typescript/compile-typescript-files").TypescriptCompilationResult, any, undefined>;
export default tscExecutor;
