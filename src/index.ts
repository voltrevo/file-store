import * as fs from 'fs';
import * as path from 'path';

import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';

type FileStore<T> = {
  get(): T,
  set(value: T): void,
};

function decode<T extends t.Type<any>>(type: T, value: unknown, description = '(anon)') {
  const decodeResult = type.decode(value);

  if (decodeResult._tag === 'Left') {
    throw new Error([
      `io-ts decoding errors for ${description}:\n`,
      PathReporter.report(decodeResult).map(s => `  ${s}`).join('\n'),
    ].join(''));
  }

  return decodeResult.right;
}

function FileStore<T extends t.Type<any>>(filePath: string, type: T): FileStore<t.TypeOf<T>> {
  let cache: { value: t.TypeOf<T> } | null = null;

  return {
    get() {
      if (cache) {
        return cache.value;
      }

      const value: t.TypeOf<T> = (() => {
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

    set(value: T) {
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

export default FileStore;
