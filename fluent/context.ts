import { ChainTag } from './tag';
import { ModuleAny } from './module';
import { ControllerClassOfModule } from './app';
import { BranchActionReturn } from './action';
import { ProvidedProviders } from './provider';

/**
 * Context
 */

export interface Store {
  concat<T>(path: ChainTag<T>, arr: T | ChainTag<T>): void;
  increment(path: ChainTag<number>, amount?: number | ChainTag<number>): void;
  merge<T>(path: ChainTag<T>, obj: Partial<T> | ChainTag<Partial<T>>): void;
  pop(path: ChainTag<Array<any>>): void;
  push<T>(path: ChainTag<Array<T> | undefined>, value: T | ChainTag<T>): void;
  set<T>(path: ChainTag<T>, value: T | ChainTag<T>): void;
  shift(path: ChainTag<Array<any>>): void;
  splice<T>(
    path: ChainTag<Array<T> | undefined>,
    début: number | ChainTag<number>,
    nbASupprimer: number | ChainTag<number>,
    ...args: Array<T | ChainTag<T>>
  ): void;
  toggle(path: ChainTag<boolean>): void;
  unset(path: ChainTag<any>): void;
  unshift<T>(path: ChainTag<Array<T>>, value: T | ChainTag<T>): void;
}

export type Get = <T>(tag: ChainTag<T>) => T;

export type Context<RootM extends ModuleAny, Props = undefined> = ProvidedProviders<RootM['__providers']> &
  (Props extends undefined ? {} : { props: Props }) & {
    store: Store;
    controller: ControllerClassOfModule<RootM>;
    get: Get;
    app: ControllerClassOfModule<RootM>;
  };

export type BranchContext<
  RootM extends ModuleAny,
  PathsProps extends { [key: string]: {} },
  Props = undefined
> = Context<RootM, Props> &
  ({
    path: {
      [K in keyof PathsProps]: PathsProps[K] extends undefined
        ? (() => BranchActionReturn)
        : ((props: PathsProps[K]) => BranchActionReturn)
    };
  });
