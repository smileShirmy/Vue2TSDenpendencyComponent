export const isFunction = (val: unknown): val is (...args: any) => any =>
  typeof val === "function";

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};

export const isArray = Array.isArray;

export function warn(msg: string) {
  console.warn(`[App]: ${msg}`);
}

export function defineFreezeProperty<T>(
  o: T,
  p: PropertyKey,
  value: PropertyDescriptor & ThisType<any>
) {
  return Object.defineProperty(o, p, {
    value,
    writable: false,
    enumerable: false,
    configurable: false,
  });
}
