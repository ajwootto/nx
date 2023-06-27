"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyAssets = void 0;
const tslib_1 = require("tslib");
const copy_assets_handler_1 = require("./copy-assets-handler");
function copyAssets(options, context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const assetHandler = new copy_assets_handler_1.CopyAssetsHandler({
            projectDir: context.projectsConfigurations.projects[context.projectName].root,
            rootDir: context.root,
            outputDir: options.outputPath,
            assets: options.assets,
            callback: typeof (options === null || options === void 0 ? void 0 : options.watch) === 'object' ? options.watch.onCopy : undefined,
        });
        const result = {
            success: true,
        };
        if (options.watch) {
            result.stop = yield assetHandler.watchAndProcessOnAssetChange();
        }
        try {
            yield assetHandler.processAllAssetsOnce();
        }
        catch (_a) {
            result.success = false;
        }
        return result;
    });
}
exports.copyAssets = copyAssets;
