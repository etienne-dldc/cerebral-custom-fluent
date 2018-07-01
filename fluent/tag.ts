import { Tag, ResolveValue, extractValueWithPath } from 'function-tree';

// type ObjUndef = { yolo: boolean } | undefined;
// type Obj = { yolo: boolean };

// type Yolo<T> = T[keyof T] extends never ? true : false

// const yolo1: Yolo<ObjUndef> = true;
// const yolo2: Yolo<Obj>  = false;

export class ChainTag<LocalState> extends Tag {
  // @ts-ignore
  __state: LocalState;
  // @ts-ignore
  private strings: Array<string> = [];
  // @ts-ignore
  private values: Array<any> = [];

  constructor(
    private type: string,
    private getter: (path: any, context: any) => any,
    private chainPath: Array<any> = []
  ) {
    super();
  }

  static noUndef<T, TheTag extends ChainTag<T | undefined>>(tag: TheTag): ChainTag<T> {
    return tag as any;
  }

  dot<K extends keyof LocalState>(part: K | ChainTag<K>): ChainTag<LocalState[K]> {
    return new ChainTag<LocalState[K]>(this.type, this.getter, [...this.chainPath, part]);
  }

  maybe<T, K extends string = string>(
    part: K | ChainTag<K>
  ): K extends keyof Exclude<LocalState, null | undefined>
    ? ChainTag<Exclude<LocalState, null | undefined>[K] | undefined>
    : never {
    return new ChainTag<T>(this.type, this.getter, [...this.chainPath, part]) as any;
  }

  // Returns all tags, also nested to identify nested state dependencies in components
  getTags() {
    return [this].concat(this.getNestedTags());
  }

  // Gets the path of the tag, where nested tags are evaluated
  getPath(context: any) {
    const resolvedParts = this.chainPath.map((pathPart, idx) => {
      if (pathPart instanceof ResolveValue) {
        return (pathPart as any).getValue(context);
      }
      return pathPart;
    });
    return resolvedParts.join('.');
  }

  getValue(context: any) {
    return this.getter(this.getPath(context), context);
  }

  // Grab nested tags from the tags current path
  getNestedTags() {
    return this.chainPath.reduce<Array<any>>((currentPaths, pathPart, idx) => {
      if (pathPart instanceof Tag) {
        return currentPaths.concat(pathPart);
      }
      return currentPaths;
    }, []);
  }

  // Produces a string representation of the tag
  toString() {
    return this.type + '`' + this.pathToString() + '`';
  }

  // Produces a string representation of the path
  pathToString() {
    const resolvedParts = this.chainPath.map((pathPart, idx) => {
      if (pathPart instanceof Tag) {
        return pathPart.toString();
      }
      return pathPart;
    });
    return resolvedParts.join('.');
  }
}

export function createStateChainTag<State>() {
  return new ChainTag<State>('state', (path, context) => {
    return context.controller.getState(path);
  });
}

export function createSequenceChainTag<State>() {
  return new ChainTag<State>('sequences', (path, context) => {
    return context.controller.getSequence(path) || context.controller.getSequences(path);
  });
}

export function createPropsChainTag<Props>() {
  return new ChainTag<Props>('props', (path, context) => {
    return extractValueWithPath(context.props, path);
  });
}

export function createComputedChainTag<Computed>() {
  return new ChainTag<Computed>('computed', (path, context) => {
    return context.controller.getComputed(path);
  });
}
