import * as t from 'io-ts';
declare type FileStore<T> = {
    get(): T;
    set(value: T): void;
};
declare function FileStore<T extends t.Type<any>>(filePath: string, type: T): FileStore<t.TypeOf<T>>;
export default FileStore;
//# sourceMappingURL=index.d.ts.map