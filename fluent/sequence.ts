import { debounce } from 'function-tree/factories';
import { parallel, sequence as ftSequence } from 'function-tree';
import {
  branchActionFactory,
  WhenAction,
  BranchAction,
  WhenActionPathsProps,
  Action,
  DebounceActionPathsProps,
} from './action';
import { ModuleAny } from './module';

function notNil<T>(val: T | null | undefined): T {
  if (val === null || val === undefined) {
    throw new Error('Invariant: value should not be null | undefined');
  }
  return val;
}

function notUndefined<T>(val: T | undefined): T {
  if (val === undefined) {
    throw new Error('Invariant: value should not be undefined');
  }
  return val;
}

/**
 * Sequence
 */

const SECRET_SYMBOL = Symbol();

export type Sequence<Props = {}, Output = {}> = {
  [SECRET_SYMBOL]: true;
  __props: Props;
  __output: Output;
};

export type SequenceDef<Sequences extends { [key: string]: Sequence<any, any> }> = {
  [K in keyof Sequences]: Sequence<
    Sequences[K]['__props'],
    Sequences[K]['__output'] extends undefined ? any : Sequences[K]['__output']
  >
};

// export function sequenceFactory<RootM extends ModuleAny>() {
//   function sequence<Props = undefined,  Output = Props>(action: Action<Props, Output>): Sequence<Props, Output>
//   function sequence<Props = undefined, Output = Props>(action: Action<Props, Output>): Sequence<Props, Output> {
//     return [action] as any;
//   }
//   return sequence;
// }

export type MergeProps<Prev, Next> = Next extends undefined
  ? Prev
  : ({ [K in keyof Prev]: K extends keyof Next ? Next[K] : Prev[K] } & { [K in keyof Next]: Next[K] });

type BranchOutput<RootM extends ModuleAny, Props, PathsProps extends { [key: string]: {} }> = {
  paths: <PathsOutputs extends { [K in keyof PathsProps]: {} }>(
    paths: {
      [key in keyof PathsProps]: (
        input: SequenceBuilder<RootM, Props & (PathsProps[key] extends never ? {} : PathsProps[key])>
      ) => SequenceBuilder<RootM, PathsOutputs[key]>
    }
  ) => SequenceBuilder<RootM, Props & PathsOutputs[keyof PathsOutputs]>;
};

export class SequenceBuilder<RootM extends ModuleAny, Props = undefined> {
  protected sequenceArray: Array<any>;

  constructor(sequenceArray: Array<any>) {
    this.sequenceArray = sequenceArray;
  }

  props<Output>(transform: (props: Props) => Output): SequenceBuilder<RootM, MergeProps<Props, Output>> {
    const mapper = ({ props }: any) => {
      return transform(props);
    };
    Object.defineProperty(mapper, 'name', { value: 'mapProps' });
    this.sequenceArray.push(mapper);
    return new SequenceBuilder<RootM, MergeProps<Props, Output>>(this.sequenceArray);
  }

  actionWithOutput<Output, ActionProps = {}>(
    action: Action<RootM, ActionProps, Output>
  ): Props extends ActionProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true };
  actionWithOutput<Output, ActionProps = {}>(
    name: string,
    action: Action<RootM, ActionProps, Output>
  ): Props extends ActionProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true };
  actionWithOutput<Output, ActionProps = {}>(
    name: string | (Action<RootM, ActionProps, Output>),
    action?: Action<RootM, ActionProps, Output>
  ): Props extends ActionProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true } {
    return this.action<ActionProps, Output>(name as any, action as any) as any;
  }

  action<ActionProps, Output = {}>(
    action: Action<RootM, ActionProps, Output>
  ): Props extends ActionProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true };
  action<ActionProps, Output = {}>(
    name: string,
    action: Action<RootM, ActionProps, Output>
  ): Props extends ActionProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true };
  action<ActionProps, Output = {}>(
    name: string | (Action<RootM, ActionProps, Output>),
    action?: Action<RootM, ActionProps, Output>
  ): Props extends ActionProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true } {
    const wisthName = typeof name === 'string';
    if (wisthName && action === undefined) {
      throw new Error('Missing action');
    }
    const theAction = wisthName ? action : name;
    if (wisthName) {
      Object.defineProperty(theAction, 'name', { value: name });
    }
    this.sequenceArray.push(theAction);
    return new SequenceBuilder<RootM, MergeProps<Props, Output>>(this.sequenceArray) as any;
  }

  branch<PathsProps extends { [key: string]: {} }, ActionProps extends {} = {}>(
    action: BranchAction<RootM, PathsProps, ActionProps>
  ): Props extends ActionProps ? BranchOutput<RootM, Props, PathsProps> : { incompatibleProps: true } {
    this.sequenceArray.push(action);
    const result: BranchOutput<RootM, Props, PathsProps> = {
      paths: <PathsOutputs extends { [K in keyof PathsProps]: {} }>(
        paths: {
          [key in keyof PathsProps]: (
            input: SequenceBuilder<RootM, Props & PathsProps[key]>
          ) => SequenceBuilder<RootM, PathsOutputs[key]>
        }
      ): SequenceBuilder<RootM, Props & PathsOutputs[keyof PathsOutputs]> => {
        const outputSequence = generatePathSequence<RootM, PathsProps, PathsOutputs, Props>(paths);
        this.sequenceArray.push(outputSequence);
        return new SequenceBuilder<RootM, Props & PathsOutputs[keyof PathsOutputs]>(this.sequenceArray);
      },
    };
    return result as any;
  }

  parallel<Output = undefined>(
    name: string,
    chain: ((input: SequenceBuilder<RootM, Props>) => SequenceBuilder<RootM, Output>)
  ): SequenceBuilder<RootM, MergeProps<Props, Output>>;
  parallel<Output>(
    chain: ((input: SequenceBuilder<RootM, Props>) => SequenceBuilder<RootM, Output>)
  ): SequenceBuilder<RootM, MergeProps<Props, Output>>;
  parallel<Output>(...args: Array<any>): SequenceBuilder<RootM, MergeProps<Props, Output>> {
    const cb = new SequenceBuilder<RootM, Props>([]);
    const callback = typeof args[0] === 'string' ? args[1] : args[0];
    const name = typeof args[0] === 'string' ? args[0] : '';
    const result = callback(cb);
    this.sequenceArray.push(parallel(name, result.sequenceArray));
    return new SequenceBuilder<RootM, MergeProps<Props, Output>>(this.sequenceArray);
  }

  when(whenAction: WhenAction<RootM, Props>): BranchOutput<RootM, Props, WhenActionPathsProps>;
  when(name: string, whenAction: WhenAction<RootM, Props>): BranchOutput<RootM, Props, WhenActionPathsProps>;
  when(
    name: string | WhenAction<RootM, Props>,
    whenAction?: WhenAction<RootM, Props>
  ): BranchOutput<RootM, Props, WhenActionPathsProps> {
    const theCallback = notUndefined(typeof name === 'string' ? whenAction : name) as any;
    const theName = typeof name === 'string' ? `when ${name}` : theCallback.name || 'when';
    const theWhen = branchActionFactory()<{ true: never; false: never }, Props>(theName, context => {
      return theCallback(context) ? context.path.true() : context.path.false();
    });
    return this.branch<{ true: never; false: never }, Props>(theWhen as any) as any;
  }

  sequence<SequenceProps, Output>(
    sequence: Sequence<SequenceProps, Output>
  ): Props extends SequenceProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true };
  sequence<SequenceProps extends {}, Output>(
    name: string,
    sequence: Sequence<SequenceProps, Output>
  ): Props extends SequenceProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true };
  sequence<SequenceProps extends {}, Output>(
    name: string | (Sequence<SequenceProps, Output>),
    sequence?: Sequence<SequenceProps, Output>
  ): Props extends SequenceProps ? SequenceBuilder<RootM, MergeProps<Props, Output>> : { incompatibleProps: true } {
    const theSequence = notNil(typeof name === 'string' ? sequence : name);
    if (typeof name === 'string') {
      this.sequenceArray.push(ftSequence(name, theSequence as any));
    } else {
      this.sequenceArray.push(theSequence);
    }
    return new SequenceBuilder<RootM, MergeProps<Props, Output>>(this.sequenceArray) as any;
  }

  debounce(ms: number): BranchOutput<RootM, Props, DebounceActionPathsProps> {
    return this.branch<DebounceActionPathsProps, Props>(debounce(ms) as any) as any;
  }

  // equals<Paths extends { [key: string]: {}; otherwise: {} }, TValue>(
  //   callback: (input: TContext & IBranchContext<Paths, TProps>) => TValue
  // ) {
  //   function equals(context: TContext & IBranchContext<Paths, TProps>) {
  //     const result = String(callback(context));
  //     return context.path[result] ? context.path[result]({}) : context.path.othersise({});
  //   }
  //   return this.branch<Paths>(equals);
  // }

  // wait(ms: number) {
  //   this.sequenceArray.push(wait(ms));
  //   return new ContinueSequenceBuilder<TContext, TProps>(this.sequenceArray);
  // }
}

// export class ContinueSequenceBuilder<TContext = {}, TProps = {}> extends SequenceBuilder<TContext, TProps> {
//   continue(arg: (builder: SequenceBuilder<TContext, TProps>) => SequenceBuilder<TContext, TProps>) {
//     const builder = new SequenceBuilder<TContext, TProps>([]);
//     this.sequenceArray.push({
//       continue: (builder as any).sequenceArray,
//     });
//     return builder;
//   }
// }

function generatePathSequence<
  RootM extends ModuleAny,
  PathsProps extends { [key: string]: {} },
  PathsOutputs extends { [K in keyof PathsProps]: {} },
  Props
>(
  paths: {
    [key in keyof PathsProps]: (
      input: SequenceBuilder<RootM, Props & PathsProps[key]>
    ) => SequenceBuilder<RootM, PathsOutputs[key]>
  }
) {
  const outputSequence: { [key in keyof PathsProps]?: Array<any> } = {};
  for (const key in paths) {
    if (paths.hasOwnProperty(key)) {
      const cb = new SequenceBuilder<RootM, Props>([]);
      const chain = paths[key];
      chain(cb as any);
      outputSequence[key] = (cb as any).sequenceArray;
    }
  }
  return outputSequence;
}

type SequenceBuilderFunc<RootM extends ModuleAny, Props, Output> = (
  input: SequenceBuilder<RootM, Props>
) => SequenceBuilder<RootM, Output extends undefined ? any : Output>;

export function sequenceFactory<RootM extends ModuleAny>() {
  function returned<Props = {}, Output = {}>(arg: SequenceBuilderFunc<RootM, Props, Output>): Sequence<Props, Output>;
  function returned<Props = {}, Output = {}>(
    name: string,
    arg: SequenceBuilderFunc<RootM, Props, Output>
  ): Sequence<Props, Output>;
  function returned<Props = {}, Output = {}>(
    name: string | SequenceBuilderFunc<RootM, Props, Output>,
    arg?: SequenceBuilderFunc<RootM, Props, Output>
  ): Sequence<Props, Output> {
    const wisthName = typeof name === 'string';
    if (wisthName && arg === undefined) {
      throw new Error('Missing arg');
    }
    const theArg = notNil(typeof name === 'string' ? arg : name);
    const builder = new SequenceBuilder<RootM, Props>([]);
    const outSeq = (theArg(builder) as any).sequenceArray;
    if (typeof name === 'string') {
      return ftSequence(name, outSeq) as any;
    }
    return outSeq;
  }
  return returned;
}
