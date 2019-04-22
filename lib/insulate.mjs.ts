// Prevent write access, and ensure objects don't pass the barrier
// between warm (inside warmTarget or the return values of its descendants)
// and cold (outside warmTarget), unless they are also insulated.
//
// The cold/warm identity maps are created fresh for each actual insulate()
// call, but not for the silent wrapping of returns, throws, this, and
// arguments.  This allows wrapping/unwrapping of values that transition
// the delineated insulation boundary with read-only Proxies rather
// having to harden them on every transition and losing useful but
// harmless mutability.
//
// The proxying provided by insulate() is orthogonal to harden() and
// Object.freeze.  You can still call harden() on your own data and
// pass it into insulated() functions, but not on proxies that have
// originated in an insulated() function, as that data belongs to
// somebody else).

import harden from '@agoric/harden';

// The $h_uninsulated set is a list of global identities that should never
// be wrapped.  It is included for bootstrap purposes, but MUST NOT
// be exportd to Jessie.
//
// The `$h_` prefix is a safeguard to prevent valid Jessie code from ever
// referencing this set as an identifier.
export const $h_uninsulated = harden(new WeakSet());

// These types are taken from @agoric/harden.  Please do update
// them there, especially when Typescript provides a way to express
// HardenedFunction/InsulatedFunction.
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

const insulate = harden(<T>(warmTarget: T): Insulated<T> => {
    const warmToColdMap = new WeakMap(), coldToWarmMap = new WeakMap();
    const wrapWithMaps = (obj: any, inMap: WeakMap<object, any>, outMap: WeakMap<object, any>): any => {
        if (Object(obj) !== obj || $h_uninsulated.has(obj)) {
            // It's a neutral (primitive) type.
            return obj;
        }
        // We are sending out the object, so find it in the cache.
        const wrapped = outMap.get(obj);
        if (wrapped) {
            return wrapped;
        }
        // If we want an object to come in, we reverse the map (our
        // inside is the object's outside).
        const enter = (inbound: any) => wrapWithMaps(inbound, outMap, inMap);
        // If we want send an object out, we keep the order (our inside
        // is the object's inside).
        const leave = (outThunk: () => any) => {
            try {
                return wrapWithMaps(outThunk(), inMap, outMap);
            }
            catch (e) {
                throw wrapWithMaps(e, inMap, outMap);
            }
        };
        const err = (msg: string) => leave(() => {
            throw wrapWithMaps(TypeError(msg), inMap, outMap);
        });
        const handler = {
            // Traps that make sure our object is read-only.
            defineProperty(_target: any, prop: string | number, _attributes: any) {
                throw err(`Cannot define property ${JSON.stringify(String(prop))} on insulated object`);
            },
            setPrototypeOf(_target: any, _v: any) {
                throw err(`Cannot set prototype of insulated object`);
            },
            set(_target: any, prop: string | number, _value: any) {
                throw err(`Cannot set property ${JSON.stringify(String(prop))} on insulated object`);
            },
            // We maintain our extensible state, both for the
            // Proxy invariants and because we don't want to modify
            // the target AT ALL!
            isExtensible(target: any) {
                return Reflect.isExtensible(target);
            },
            preventExtensions(target: any) {
                if (!Reflect.isExtensible(target)) {
                    // Already prevented extensions, so succeed.
                    return true;
                }
                // This is a mutation.  Not allowed.
                throw err(`Cannot prevent extensions of insulated object`);
            },
            // The traps that have a reasonably simple implementation:
            get(target: any, prop: string | number, receiver: any) {
                return leave(() => Reflect.get(target, prop, receiver));
            },
            getPrototypeOf(target: any) {
                return leave(() => Reflect.getPrototypeOf(target));
            },
            ownKeys(target: any) {
                return leave(() => Reflect.ownKeys(target));
            },
            has(target: any, key: string | number) {
                return leave(() => key in target);
            },
            getOwnPropertyDescriptor(target: any, prop: string | number) {
                return leave(() => Reflect.getOwnPropertyDescriptor(target, prop));
            },
            // The recursively-wrapping traps.
            apply(target: any, thisArg: any, argumentsList: any[]) {
                // If the target method is from outside, but thisArg is not from outside,
                // nor already exported to outside, we have insulation-crossing `this` capture.
                if (Object(thisArg) === thisArg &&
                    outMap.get(target) && !inMap.get(thisArg) && !outMap.get(thisArg)) {
                    // Block accidental `this`-capture, but don't break
                    // callers that ignore `this` anyways.
                    thisArg = undefined;
                }
                const wrappedThis = enter(thisArg);
                const wrappedArguments = argumentsList.map(enter);
                return leave(() => Reflect.apply(target, wrappedThis, wrappedArguments));
            },
            construct(target: any, args: any[]) {
                const wrappedArguments = args.map(enter);
                return leave(() => Reflect.construct(target, wrappedArguments));
            },
        };
        // Now we can construct an insulated object, which
        // makes it effectively read-only and transitively
        // maintains the temperatures of the inside and outside.
        const insulated = new Proxy(obj, handler);
        // We're putting the insulated object outside, so mark it
        // for our future inputs/outputs.
        outMap.set(obj, insulated);
        inMap.set(insulated, obj);
        return insulated;
    };
    return wrapWithMaps(warmTarget, coldToWarmMap, warmToColdMap);
});

// Prevent infinite regress.
$h_uninsulated.add(insulate);

export default insulate;
