import harden from '@agoric/harden';

// These are exported because Jessie code cannot call `new`.
export const makePromise = harden((...args) => harden(new Promise(...args)));
export const makeMap = harden((...args) => harden(new Map(...args)));
export const makeSet = harden((...args) => harden(new Set(...args)));
export const makeWeakMap = harden((...args) => harden(new WeakMap(...args)));
export const makeWeakSet = harden((...args) => harden(new WeakSet(...args)));
