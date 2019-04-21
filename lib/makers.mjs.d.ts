import harden from '@agoric/harden';
export function makePromise<T>(...args: any[]): harden.Hardened<Promise<T>>;
export function makeMap<K, V>(...args: any[]): harden.Hardened<Map<K, V>>;
export function makeSet<T>(...args: any[]): harden.Hardened<Set<T>>;
export function makeWeakMap<K, V>(...args: any[]): harden.Hardened<WeakMap<K, V>>;
export function makeWeakSet<T>(...args: any[]): harden.Hardened<WeakSet<T>>;
