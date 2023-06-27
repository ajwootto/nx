import { AssetGlob } from './assets';
export type FileEventType = 'create' | 'update' | 'delete';
export interface FileEvent {
    type: FileEventType;
    src: string;
    dest: string;
}
interface CopyAssetHandlerOptions {
    projectDir: string;
    rootDir: string;
    outputDir: string;
    assets: (string | AssetGlob)[];
    callback?: (events: FileEvent[]) => void;
}
export declare const defaultFileEventHandler: (events: FileEvent[]) => void;
export declare class CopyAssetsHandler {
    private readonly projectDir;
    private readonly rootDir;
    private readonly outputDir;
    private readonly assetGlobs;
    private readonly ignore;
    private readonly callback;
    constructor(opts: CopyAssetHandlerOptions);
    processAllAssetsOnce(): Promise<void>;
    watchAndProcessOnAssetChange(): Promise<() => void>;
    private processEvents;
}
export {};
