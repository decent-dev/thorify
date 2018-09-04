"use strict";
/* tslint:disable:max-line-length */
// forked from ethjs-provider-http

// workaround to use http provider in different envs
const errors = require("web3-core-helpers").errors;
// Default connection ws://localhost:8546

class ThorWSProvider {
    private web3: any;
    private host: string;
    private timeout: number;
    private responseCallbacks: any = {};
    private SUB_TYPE_BLOCK: string = "block";
    private SUB_TYPE_EVENT: string = "event";

    constructor(web3: object, host: string, timeout = 0) {
        if (!host) { throw new Error('[thorify-provider-ws] thorify requires that the host be specified (e.g. "http://localhost:8669")'); }

        this.web3 = web3;
        this.host = this._getWsHost(host);
        this.timeout = timeout;
    }
    public getSubscription(type: string = this.SUB_TYPE_BLOCK, fromBlock: string, addr: string, topics: object, onData: any) {
        if (!this._isValidType(type)) {
            throw new Error("Invalid subscription type");
        }
        this.web3.eth.getBlock(fromBlock ? fromBlock : "latest").then((block: any) => {
            const pos = block.id;
            const url = this._getSubscriptionUrl(type, pos, addr, topics);
            const Ws = this.getWsInstance();
            Ws.connect(url);
            Ws.on("connect", (connection: any) => {
                this._addDefaultEvents(connection);
                connection.on("message", (message: any) => {
                    if (message.type === "utf8") {
                        // On new event
                        const data = message.utf8Data;
                        onData(data);
                    }
                });
            });
        });
    }
    private getWsInstance() {
        let Ws = null;
        if (typeof window !== "undefined") {
            Ws = (window as any).WebSocket;
        } else {
            const WebSocketClient = require("websocket").client;
            Ws = new WebSocketClient();
        }
        return Ws;
    }
    private _getWsHost(host: string) {
        return host.replace(/(http)(s)?\:\/\//, "ws$2://");
    }
    private _getSubscriptionUrl(type: string, pos: string, addr: string, topics: any) {
        if (type === this.SUB_TYPE_BLOCK) {
            return this.host + "/subscriptions/" + this.SUB_TYPE_BLOCK + "?pos=" + pos;
        } else {
            let url = this.host + "/subscriptions/" + this.SUB_TYPE_EVENT + "?pos=" + pos + "&addr=" + addr;
            topics.forEach((topic: string, index: number) => url += "&t" + index + "=" + topic);
            return url;
        }
    }
    private _isValidType(type: string) {
        return type === this.SUB_TYPE_BLOCK || type === this.SUB_TYPE_EVENT;
    }
    private _addDefaultEvents(connection: any) {
      const _this = this;
      connection.on("error", function() {
          _this._timeout(connection);
      });
      connection.on("close", function() {
          _this._timeout(connection);
          _this._reset(connection);
      });
    }
    private _timeout(connection: any) {
        for (const key in this.responseCallbacks) {
            if (this.responseCallbacks.hasOwnProperty(key)) {
                this.responseCallbacks[key](errors.InvalidConnection("on WS"));
                delete this.responseCallbacks[key];
            }
        }
    }
    private _reset(connection: any) {
        this._timeout(connection);
        this._addDefaultEvents(connection);
    }
}

export {
    ThorWSProvider,
};
