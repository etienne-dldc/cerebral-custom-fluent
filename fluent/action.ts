import { ModuleAny } from './module';
import { Context, BranchContext } from './context';

/**
 * Action
 */

// export type Action<RootM extends ModuleAny, ScopeM extends ModuleAny, Props extends {} = {}, Output = void> = (
//   context: Context<RootM, ScopeM, Props>
// ) => Output | void;

// export type BranchAction<
//   RootM extends ModuleAny,
//   ScopeM extends ModuleAny,
//   Paths extends object,
//   Props extends {} = {},
//   Output = void
// > = (context: BranchContext<RootM, ScopeM, Paths, Props>) => Paths[keyof Paths] | void;

const SECRET_SYMBOL = Symbol();

export type BranchActionReturn = {
  [SECRET_SYMBOL]: true;
};

export interface Action<RootM extends ModuleAny, Props, Output> {
  (ctx: Context<RootM, Props>): undefined extends Output ? (void | Promise<void>) : (Output | Promise<Output>);
  __output?: Output;
  __props?: Props;
}

export function actionFactory<RootM extends ModuleAny>() {
  function returned<Props = any, Output = {}>(
    name: string,
    action: {} extends Output ? Action<RootM, Props, Output | undefined> : Action<RootM, Props, Output>
  ): Action<RootM, Props, Output>;
  function returned<Props = any, Output = {}>(
    action: {} extends Output ? Action<RootM, Props, Output | undefined> : Action<RootM, Props, Output>
  ): Action<RootM, Props, Output>;
  function returned<Props = any, Output = {}>(
    nameOrAction:
      | string
      | ({} extends Output ? Action<RootM, Props, Output | undefined> : Action<RootM, Props, Output>),
    action?: {} extends Output ? Action<RootM, Props, Output | undefined> : Action<RootM, Props, Output>
  ): Action<RootM, Props, Output> {
    const wisthName = typeof nameOrAction === 'string';
    if (wisthName && action === undefined) {
      throw new Error('Missing action');
    }
    const theAction = wisthName ? action : nameOrAction;
    if (wisthName) {
      Object.defineProperty(theAction, 'name', { value: nameOrAction });
    }
    return theAction as any;
  }
  return returned;
}

export type BranchAction<RootM extends ModuleAny, PathsProps extends { [key: string]: {} }, Props> = (
  ctx: BranchContext<RootM, PathsProps, Props>
) => BranchActionReturn | Promise<BranchActionReturn>;

export type WhenAction<RootM extends ModuleAny, Props> = (
  ctx: BranchContext<RootM, WhenActionPathsProps, Props>
) => boolean;

export type OutputOfPathsProps<PathsProps extends { [key: string]: {} }> = {
  [K in keyof PathsProps]: PathsProps[K] extends undefined ? {} : PathsProps[K]
};

export function branchActionFactory<RootM extends ModuleAny>() {
  function returned<PathsProps extends { [key: string]: {} }, Props = undefined>(
    name: string,
    action: BranchAction<RootM, PathsProps, Props>
  ): BranchAction<RootM, PathsProps, Props>;
  function returned<PathsProps extends { [key: string]: {} }, Props = undefined>(
    action: BranchAction<RootM, PathsProps, Props>
  ): BranchAction<RootM, PathsProps, Props>;
  function returned<PathsProps extends { [key: string]: {} }, Props = undefined>(
    nameOrAction: string | BranchAction<RootM, PathsProps, Props>,
    action?: BranchAction<RootM, PathsProps, Props>
  ): BranchAction<RootM, PathsProps, Props> {
    const wisthName = typeof nameOrAction === 'string';
    if (wisthName && action === undefined) {
      throw new Error('Missing action');
    }
    const theAction = wisthName ? action : nameOrAction;
    if (wisthName) {
      Object.defineProperty(theAction, 'name', { value: nameOrAction });
    }
    return theAction as any;
  }
  return returned;
}

export type WhenActionPathsProps = { true: never; false: never };

export function whenActionFactory<RootM extends ModuleAny>() {
  function returned<Props = undefined>(name: string, action: WhenAction<RootM, Props>): WhenAction<RootM, Props>;
  function returned<Props = undefined>(action: WhenAction<RootM, Props>): WhenAction<RootM, Props>;
  function returned<Props = undefined>(
    nameOrAction: string | WhenAction<RootM, Props>,
    action?: WhenAction<RootM, Props>
  ): WhenAction<RootM, Props> {
    const wisthName = typeof nameOrAction === 'string';
    if (wisthName && action === undefined) {
      throw new Error('Missing action');
    }
    const theAction = wisthName ? action : nameOrAction;
    if (wisthName) {
      Object.defineProperty(theAction, 'name', { value: nameOrAction });
    }
    return theAction as any;
  }
  return returned;
}

export type DebounceActionPathsProps = { continue: never; discard: never };
