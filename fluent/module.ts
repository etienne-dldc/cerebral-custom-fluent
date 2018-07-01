import { Sequence } from './sequence';
import { ControllerClassOfModule } from './app';
import { Provider } from './provider';

/**
 * Module
 */

export type ExtendsSequences = { [key: string]: Sequence<any, any> };
export type ExtendsComputed = { [key: string]: any };
export type ExtendsReactions = { [key: string]: any };
export type ExtendsModules = { [key: string]: ModuleAny };
export type ExtendsProviders = { [providerName: string]: Provider<any> };

type ModuleStub = { name: string; path: Array<string>; controller: ControllerClassOfModule<ModuleAny> };

interface ErrorClass {
  new (...args: Array<any>): any;
}

export interface ModuleObject<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
> {
  state?: State;
  sequences?: Sequences;
  computed?: Computed;
  reactions?: ExtendsReactions;
  modules?: Modules;
  providers?: Providers;
  catch?: Array<[ErrorClass, Sequence]>;
}

export type ModuleAny = Module<{}, {}, {}, {}, {}>;

type ModuleFunction<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
> = ((module: ModuleStub) => ModuleObject<State, Sequences, Computed, Modules, Providers>);

type ModuleDefinition<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
> =
  | ModuleObject<State, Sequences, Computed, Modules, Providers>
  | ModuleFunction<State, Sequences, Computed, Modules, Providers>;

const SECRET_SYMBOL = Symbol();

export interface Module<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
> {
  [SECRET_SYMBOL]: true;
  __state: State;
  __sequences: Sequences;
  __sequences_external: {
    [K in keyof Sequences]: {} extends Sequences[K]['__props']
      ? () => Sequences[K]['__output']
      : (props: Sequences[K]['__props']) => Sequences[K]['__output']
  };
  __computed: Computed;
  __reactions: ExtendsReactions;
  __modules: Modules;
  __providers: Providers;
  (module: ModuleStub): ModuleObject<State, Sequences, Computed, Modules, Providers>;
}

export function Module<
  State,
  Sequences extends ExtendsSequences,
  Computed extends ExtendsComputed,
  Modules extends ExtendsModules,
  Providers extends ExtendsProviders
>(
  moduleDefinition: ModuleDefinition<State, Sequences, Computed, Modules, Providers>
): Module<State, Sequences, Computed, Modules, Providers> {
  return moduleDefinition as any;
}

export type ModuleState<State, Modules extends { [key: string]: ModuleAny }> = State &
  { [K in keyof Modules]: ModuleState<Modules[K]['__state'], Modules[K]['__modules']> };
export type ModuleSequences<Sequences, Modules extends { [key: string]: ModuleAny }> = Sequences &
  { [K in keyof Modules]: ModuleSequences<Modules[K]['__sequences_external'], Modules[K]['__modules']> };
export type ModuleComputed<Computed, Modules extends { [key: string]: ModuleAny }> = Computed &
  { [K in keyof Modules]: ModuleComputed<Modules[K]['__computed'], Modules[K]['__modules']> };
export type ModuleReactions<Reactions, Modules extends { [key: string]: ModuleAny }> = Reactions &
  { [K in keyof Modules]: ModuleReactions<Modules[K]['__reactions'], Modules[K]['__modules']> };
