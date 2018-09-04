"use strict";
const debug = require("debug")("thor:injector");
const _ = require("underscore");
const EventEmitter = require("eventemitter3");

const extendSubscribe = function(web3: any) {
    web3.eth.subscribe = function(name: string) {
        const eventEmitter = new EventEmitter();
        // TODO: Handle more cases with "name" once other subscriptions are added to Thor
        // create new subscription
        web3.wsProvider.getSubscription("block", null, null, null, function(output: any) {
            output = JSON.parse(output);
            eventEmitter.emit("data", output);
        });
        return eventEmitter;
    };
};

export {
    extendSubscribe,
};
