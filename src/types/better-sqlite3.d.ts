declare module "better-sqlite3" {
  class Statement {
    run(...params: any[]): any;
    get(...params: any[]): any;
    all(...params: any[]): any[];
  }

  class Database {
    constructor(filename: string, options?: Record<string, any>);
    prepare(sql: string): Statement;
    exec(sql: string): this;
    close(): void;
  }

  namespace Database {
    export { Database };
  }

  export = Database;
}
