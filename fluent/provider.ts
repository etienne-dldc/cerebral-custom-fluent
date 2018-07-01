import { Provider as CerebralProvider } from 'cerebral';
import { ExtendsProviders } from './module';

const SECRET_SYMBOL = Symbol();

export type Provider<T> = {
  [SECRET_SYMBOL]: true;
  __type: T;
};

export function Provider<T extends { [key: string]: any }>(obj: T): Provider<T> {
  return CerebralProvider(obj) as any;
}

export type ProvidedProviders<Providers extends ExtendsProviders> = { [K in keyof Providers]: Providers[K]['__type'] };
