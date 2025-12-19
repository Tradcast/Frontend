declare module 'ws' {
  import { EventEmitter } from 'events';
  import { IncomingMessage, ClientRequest } from 'http';
  import { Duplex } from 'stream';

  class WebSocket extends EventEmitter {
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;

    readonly readyState: number;
    readonly url: string;

    constructor(address: string | URL, options?: WebSocket.ClientOptions);
    constructor(address: string | URL, protocols?: string | string[], options?: WebSocket.ClientOptions);

    close(code?: number, reason?: string | Buffer): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(data: any, options: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }, cb?: (err?: Error) => void): void;
    terminate(): void;

    on(event: 'close', listener: (code: number, reason: Buffer) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'ping' | 'pong', listener: (data: Buffer) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  namespace WebSocket {
    interface ClientOptions {
      protocol?: string;
      followRedirects?: boolean;
      handshakeTimeout?: number;
      maxRedirects?: number;
      perMessageDeflate?: boolean | object;
      localAddress?: string;
      protocolVersion?: number;
      headers?: { [key: string]: string };
      origin?: string;
      agent?: any;
      host?: string;
      family?: number;
      checkServerIdentity?(servername: string, cert: any): boolean;
      rejectUnauthorized?: boolean;
      maxPayload?: number;
      skipUTF8Validation?: boolean;
    }

    interface ServerOptions {
      host?: string;
      port?: number;
      backlog?: number;
      server?: any;
      verifyClient?: any;
      handleProtocols?: any;
      path?: string;
      noServer?: boolean;
      clientTracking?: boolean;
      perMessageDeflate?: boolean | object;
      maxPayload?: number;
      skipUTF8Validation?: boolean;
    }
  }

  class WebSocketServer extends EventEmitter {
    constructor(options?: WebSocket.ServerOptions, callback?: () => void);
    
    close(cb?: (err?: Error) => void): void;
    handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer, callback: (client: WebSocket, request: IncomingMessage) => void): void;
    shouldHandle(request: IncomingMessage): boolean;
    
    on(event: 'connection', listener: (socket: WebSocket, request: IncomingMessage) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'headers', listener: (headers: string[], request: IncomingMessage) => void): this;
    on(event: 'close' | 'listening', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    
    clients: Set<WebSocket>;
  }

  export { WebSocket as default, WebSocketServer };
}

