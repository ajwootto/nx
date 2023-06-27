import { ExecutorContext } from '@nx/devkit';
import { NormalizedSwcExecutorOptions, SwcExecutorOptions } from '../../utils/schema';
export declare function normalizeOptions(options: SwcExecutorOptions, contextRoot: string, sourceRoot?: string, projectRoot?: string): NormalizedSwcExecutorOptions;
export declare function swcExecutor(_options: SwcExecutorOptions, context: ExecutorContext): AsyncGenerator<{
    success: boolean;
    outfile?: undefined;
} | {
    success: boolean;
    outfile: string;
}, any, undefined>;
export default swcExecutor;
