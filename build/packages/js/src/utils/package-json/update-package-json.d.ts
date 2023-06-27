import { ExecutorContext, ProjectFileMap, ProjectGraphProjectNode } from '@nx/devkit';
import { DependentBuildableProjectNode } from '../buildable-libs-utils';
import type { PackageJson } from 'nx/src/utils/package-json';
export type SupportedFormat = 'cjs' | 'esm';
export interface UpdatePackageJsonOption {
    projectRoot: string;
    main: string;
    format?: SupportedFormat[];
    outputPath: string;
    outputFileName?: string;
    outputFileExtensionForCjs?: `.${string}`;
    skipTypings?: boolean;
    generateExportsField?: boolean;
    excludeLibsInPackageJson?: boolean;
    updateBuildableProjectDepsInPackageJson?: boolean;
    buildableProjectDepsInPackageJsonType?: 'dependencies' | 'peerDependencies';
    generateLockfile?: boolean;
}
export declare function updatePackageJson(options: UpdatePackageJsonOption, context: ExecutorContext, target: ProjectGraphProjectNode, dependencies: DependentBuildableProjectNode[], fileMap?: ProjectFileMap): void;
export declare function getUpdatedPackageJsonContent(packageJson: PackageJson, options: UpdatePackageJsonOption): PackageJson;
