declare namespace pg {
  export interface PoolClient {
    query: (text: string, params?: any[]) => Promise<any>;
    release: () => void;
  }
  export class Pool {
    constructor(config?: any);
    connect: () => Promise<PoolClient>;
    query: (text: string, params?: any[]) => Promise<any>;
    end: () => Promise<void>;
  }
}

declare module 'pg' {
  export = pg;
}
