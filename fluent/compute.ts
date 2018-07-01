import { ChainTag } from './tag';
import * as Cerebral from 'cerebral';

export type ComputedGetter = <T>(arg: ChainTag<T>) => T;

// export interface ComputedDependencies {
// get: ComputedGetter;
// }

// export function Computed<T, K>(dependencies: T, cb: (dependencies: T & ComputedDependencies) => K): K;

export function Compute<K>(cb: (get: ComputedGetter) => K): K {
  return Cerebral.Compute(cb as any);
}

export function Reaction<T>(dependencies: { [L in keyof T]: ChainTag<T[L]> }, cb: (dependencies: T) => void): void {
  return Cerebral.Reaction(dependencies, cb as any);
}
