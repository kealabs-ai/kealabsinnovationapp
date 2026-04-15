"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quoteObserver = void 0;
const events_1 = require("events");
class QuoteEventEmitter extends events_1.EventEmitter {
    static instance;
    io;
    static getInstance() {
        if (!QuoteEventEmitter.instance) {
            QuoteEventEmitter.instance = new QuoteEventEmitter();
        }
        return QuoteEventEmitter.instance;
    }
    attach(io) {
        this.io = io;
        this.on('quote:created', (q) => this.io?.to('admins').emit('quote:created', q));
        this.on('quote:updated', (q) => this.io?.to('admins').emit('quote:updated', q));
    }
    notifyCreated(quote) { this.emit('quote:created', quote); }
    notifyUpdated(quote) { this.emit('quote:updated', quote); }
}
exports.quoteObserver = QuoteEventEmitter.getInstance();
//# sourceMappingURL=quote.observer.js.map