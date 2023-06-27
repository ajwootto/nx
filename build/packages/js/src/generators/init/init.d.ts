import { GeneratorCallback, Tree } from '@nx/devkit';
import { InitSchema } from './schema';
export declare function initGenerator(tree: Tree, schema: InitSchema): Promise<GeneratorCallback>;
export default initGenerator;
export declare const initSchematic: (generatorOptions: InitSchema) => (tree: any, context: any) => Promise<any>;
