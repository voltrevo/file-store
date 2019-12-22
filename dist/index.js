"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PathReporter_1 = require("io-ts/lib/PathReporter");
function decode(type, value, description = '(anon)') {
    const decodeResult = type.decode(value);
    if (decodeResult._tag === 'Left') {
        throw new Error([
            `io-ts decoding errors for ${description}:\n`,
            PathReporter_1.PathReporter.report(decodeResult).map(s => `  ${s}`).join('\n'),
        ].join(''));
    }
    return decodeResult.right;
}
function FileStore(filePath, type) {
    let cache = null;
    return {
        get() {
            if (cache) {
                return cache.value;
            }
            const value = (() => {
                switch (path.extname(filePath)) {
                    case '.json': {
                        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        return decode(type, json, filePath);
                    }
                    case '.js': {
                        const fullPath = path.resolve(process.cwd(), filePath);
                        delete require.cache[require.resolve(fullPath)];
                        // eslint-disable-next-line import/no-dynamic-require, global-require
                        return decode(type, require(fullPath), filePath);
                    }
                    default: {
                        throw new Error(`Unsupported extension: ${path.extname(filePath)}`);
                    }
                }
            })();
            cache = { value };
            setTimeout(() => { cache = null; });
            return value;
        },
        set(value) {
            switch (path.extname(filePath)) {
                case '.json': {
                    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
                    break;
                }
                default: {
                    throw new Error(`Unsupported extension: ${path.extname(filePath)}`);
                }
            }
        },
    };
}
exports.default = FileStore;
//# sourceMappingURL=index.js.map