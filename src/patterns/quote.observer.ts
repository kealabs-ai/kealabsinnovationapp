import { EventEmitter } from 'events';
import type { Server as SocketServer } from 'socket.io';
import type { Quote } from '../types';

class QuoteEventEmitter extends EventEmitter {
  private static instance: QuoteEventEmitter;
  private io?: SocketServer;

  static getInstance(): QuoteEventEmitter {
    if (!QuoteEventEmitter.instance) {
      QuoteEventEmitter.instance = new QuoteEventEmitter();
    }
    return QuoteEventEmitter.instance;
  }

  attach(io: SocketServer): void {
    this.io = io;
    this.on('quote:created', (q: Quote) => this.io?.to('admins').emit('quote:created', q));
    this.on('quote:updated', (q: Quote) => this.io?.to('admins').emit('quote:updated', q));
  }

  notifyCreated(quote: Quote): void { this.emit('quote:created', quote); }
  notifyUpdated(quote: Quote): void { this.emit('quote:updated', quote); }
}

export const quoteObserver = QuoteEventEmitter.getInstance();
