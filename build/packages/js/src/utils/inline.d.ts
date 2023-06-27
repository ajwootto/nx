import type { ExecutorContext } from '@nx/devkit';
import type { NormalizedExecutorOptions } from './schema';
interface InlineProjectNode {
    name: string;
    root: string;
    sourceRoot: string;
    pathAlias: string;
    buildOutputPath?: string;
}
export interface InlineProjectGraph {
    nodes: Record<string, InlineProjectNode>;
    externals: Record<string, InlineProjectNode>;
    dependencies: Record<string, string[]>;
}
export declare function isInlineGraphEmpty(inlineGraph: InlineProjectGraph): boolean;
export declare function handleInliningBuild(context: ExecutorContext, options: NormalizedExecutorOptions, tsConfigPath: string): InlineProjectGraph;
export declare function postProcessInlinedDependencies(outputPath: string, parentOutputPath: string, inlineGraph: InlineProjectGraph): void;
export declare function getRootTsConfigPath(context: ExecutorContext): string | null;
export {};
