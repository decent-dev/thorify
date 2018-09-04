"use strict";

import {extend} from "./extend";
import { ThorHttpProvider } from "./http-provider";
import { ThorWSProvider } from "./ws-provider";

const thorify = function(web3Instance: any, host = "http://localhost:8669", timeout= 0) {
    const httpProvider = new ThorHttpProvider(host, timeout);
    const wsProvider = new ThorWSProvider(web3Instance, host, timeout);
    web3Instance.setProvider(httpProvider);
    web3Instance.wsProvider = wsProvider;
    extend(web3Instance);
    return web3Instance;
};

export {thorify};
