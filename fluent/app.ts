import { FunctionTree } from 'function-tree';
import { DevTools } from 'cerebral/devtools';
import CerebralApp, { StateModel, RunableSequence } from 'cerebral';
import { Sequence } from './sequence';
import {
  ModuleAny,
  ExtendsSequences,
  ExtendsComputed,
  ExtendsReactions,
  ExtendsModules,
  ExtendsProviders,
  Module,
  ModuleState,
} from './module';
import { ChainTag } from 'common/lib/fluent/tag';

export interface ControllerOptions {
  devtools?: DevTools;
  throwToConsole?: boolean;
  Model?: any;
}

export interface BaseControllerClass<State, Modules extends ExtendsModules> extends FunctionTree {
  getModel(): StateModel;
  getState(): ModuleState<State, Modules>;
  getState(path?: string): any;
  get<T>(value: ChainTag<T>): T;
  runSequence<Props, Output>(name: string, signal: Sequence<Props, Output>, payload?: Props): void;
  getSequence<T = any>(path: string): RunableSequence<T>;
  addModule(path: string, module: ModuleAny): void;
  removeModule(path: string): void;
}

export interface ControllerClass<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
> extends BaseControllerClass<State, Modules> {
  flush(force: boolean): void;
  updateComponents(changes: Array<any>, force: boolean): void;
}

export type ControllerClassOfModule<RootM extends ModuleAny> = ControllerClass<
  RootM['__state'],
  RootM['__sequences'],
  RootM['__computed'],
  RootM['__modules'],
  RootM['__providers']
>;

export function App<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Reactions extends ExtendsReactions,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
>(
  rootModule: Module<State, Sequences, Computed, Modules, Providers>,
  config?: ControllerOptions
): ControllerClass<State, Sequences, Computed, Modules, Providers> {
  return CerebralApp(rootModule as any, config) as any;
}
