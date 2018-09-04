"use strict";
const debug = require("debug")("thor:injector");
const EventEmitter = require("eventemitter3");
import * as utils from "../utils";

const extendContracts = function(web3: any) {
  const _encodeEventABI = web3.eth.Contract.prototype._encodeEventABI;
  web3.eth.Contract.prototype._encodeEventABI = function(event: any, options: any): any {
    debug("_encodeEventABI");
    const result = _encodeEventABI.call(this, event, options);
    if (options.options) {
      result.options = options.options;
    }
    if (options.range) {
      result.range = options.range;
    }
    if (options.order) {
      result.order = options.order;
    }
    return result;
  };
  web3.eth.Contract.prototype._on = function() {
      const eventEmitter = new EventEmitter();
      const subOptions = this._generateEventOptions.apply(this, arguments);

      // prevent the event "newListener" and "removeListener" from being overwritten
      this._checkListener("newListener", subOptions.event.name, subOptions.callback);
      this._checkListener("removeListener", subOptions.event.name, subOptions.callback);

      const fromBlock = subOptions.params.fromBlock;
      const addr = subOptions.params.address;
      const topics = subOptions.params.topics;

      const decodeEvent = function(output: any) {
          const parsedData = web3.eth.abi.decodeLog(subOptions.event.inputs, output.data, topics);
          const returnValues: any = {};
          const inputs = subOptions.event.inputs;
          inputs.forEach((input: any) => {
              returnValues[input.name] = parsedData[input.name];
          });
          const raw = {
              data: output.data,
              topics,
          };
          const event = subOptions.event.name;
          const signature = subOptions.event.signature;
          const logIndex = 0;
          const transactionIndex = 0;
          const transactionHash = output.meta.txID;
          const blockHash = output.meta.blockID;
          const blockNumber = output.meta.blockNumber;
          return {
              returnValues,
              raw,
              event,
              signature,
              logIndex,
              transactionIndex,
              transactionHash,
              blockHash,
              blockNumber,
              address: addr,
          };
      };
      // create new subscription
      web3.wsProvider.getSubscription("event", fromBlock, addr, topics, function(output: any) {
          output = JSON.parse(output);
          const decodedEvent = decodeEvent(output);
          eventEmitter.emit("data", decodedEvent);
      });
      return eventEmitter;
  };
};

export {
  extendContracts,
};
