import harden from '@agoric/harden';

export const makePromise = harden(
    <T>(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) =>
        harden(new Promise<T>(executor)));

interface IMakeMap {
    (): harden.Hardened<Map<any, any>>;
    <K, V>(entries?: ReadonlyArray<[K, V]> | null): harden.Hardened<Map<K, V>>;
    <K, V>(iterable: Iterable<[K, V]>): harden.Hardened<Map<K, V>>;
}
export const makeMap: IMakeMap = harden(
    <K, V>(entriesOrIterable?: ReadonlyArray<[K, V]> | null) =>
        harden(new Map<K, V>(entriesOrIterable)));

export const makeSet = harden(
    <T = any>(values?: ReadonlyArray<T> | null) =>
        harden(new Set<T>(values)));

export const makeWeakMap = harden(
    <K extends object, V = any>(entries?: ReadonlyArray<[K, V]>) =>
    harden(new WeakMap<K, V>(entries)));

export const makeWeakSet = harden(<T extends object = object>(values?: ReadonlyArray<T> | null) =>
    harden(new WeakSet<T>(values)));
