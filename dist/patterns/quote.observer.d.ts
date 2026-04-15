import { EventEmitter } from 'events';
import type { Server as SocketServer } from 'socket.io';
import type { Quote } from '../types';
declare class QuoteEventEmitter extends EventEmitter {
    private static instance;
    private io?;
    static getInstance(): QuoteEventEmitter;
    attach(io: SocketServer): void;
    notifyCreated(quote: Quote): void;
    notifyUpdated(quote: Quote): void;
}
export declare const quoteObserver: QuoteEventEmitter;
export {};
//# sourceMappingURL=quote.observer.d.ts.map