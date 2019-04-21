import harden from '@agoric/harden';
export = insulate;

declare function insulate<T>(root: T): insulate.Insulated<T>;
export const $h_uninsulated: harden.Hardened<WeakSet<object>>;

// These types are taken from @agoric/harden.  Please do update
// them there, especially when Typescript provides a way to express
// HardenedFunction/InsulatedFunction.
declare namespace insulate {
  type Primitive = undefined | null | boolean | string | number;

  export type Insulated<T> =
    T extends Function ? InsulatedFunction<T> :
    T extends Primitive ? Readonly<T> :
    T extends Array<infer U> ? InsulatedArray<U> :
    // All others are manually insulated.
      InsulatedObject<T>;

  type InsulatedFunction<T> = T; // FIXME: Escape hatch.
  interface InsulatedArray<T> extends Readonly<Array<Insulated<T>>> {}
  type InsulatedObject<T> = {
    readonly [K in keyof T]: Insulated<T[K]>
  };
}
