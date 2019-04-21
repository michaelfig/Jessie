// This module should be overridden by Jessie interpreters and SES.
//
// It only exists to provide plain Javascript a mechanism to evaluate
// valid Jessie code.
export { confine, confineExpr } from './confine.mjs';
export { makePromise, makeMap, makeSet, makeWeakMap, makeWeakSet }
    from './makers.mjs';

// FIXME: Relied on by jessica, but not yet standardized.
// It may eventually be that `harden()` is exported instead of
// `insulate()`.
export { default as insulate } from './insulate.mjs';
