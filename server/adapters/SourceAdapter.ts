import { SourceInfo } from '../../src/types/index.ts';

export interface SourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly agency: string;
  readonly municipalCode: string;
  readonly url: string;
  readonly license: string;
  checkStatus(): Promise<SourceInfo>;
}

export { IbgeAdapter } from './IbgeAdapter.ts';
export { PrefeituraAdapter } from './PrefeituraAdapter.ts';
export { CnesAdapter } from './CnesAdapter.ts';
export { InepAdapter } from './InepAdapter.ts';
export { OsmAdapter } from './OsmAdapter.ts';
