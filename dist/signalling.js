"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignallingApi = void 0;
const portals_1 = require("@ceil-dev/portals");
const createSignallingApi = ({ ether, methods, onConnected, }) => {
    let signallingPortal;
    const remotes = {};
    const init = (id, { persistenceSupplier, debugSupplier }) => {
        if (signallingPortal)
            return;
        signallingPortal = (0, portals_1.createPortal)((0, portals_1.microEnv)(methods, { id }), [
            ether,
            {
                guest: (_a) => __awaiter(void 0, [_a], void 0, function* ({ payload: { id: remoteId }, portal }) {
                    yield new Promise((r) => setTimeout(r, 3000));
                    if (!remotes[remoteId]) {
                        const remote = (remotes[remoteId] = { isGuest: true });
                        remote.env = yield portal('enter', remoteId);
                        onConnected(remoteId, true);
                        if (remote.dispatchData) {
                            remote.env.face.pass(remote.dispatchData);
                        }
                    }
                    else if (remotes[remoteId].isGuest) {
                        onConnected(remoteId, true, true);
                    }
                }),
                persistence: persistenceSupplier,
                debug: debugSupplier,
            },
        ]);
        signallingPortal('open');
    };
    const enter = (remoteId) => __awaiter(void 0, void 0, void 0, function* () {
        if (!signallingPortal) {
            console.warn(`siganling: No portal?!`);
            return;
        }
        if (remotes[remoteId]) {
            console.warn(`siganling: Tried entering known remote "${remoteId}"`);
            return;
        }
        const remote = (remotes[remoteId] = {});
        remote.env = yield signallingPortal('enter', remoteId);
        onConnected(remoteId);
    });
    const dispatch = (recipient, data) => {
        if (!remotes[recipient]) {
            console.warn(`WebRTC signalling: Tried to dispatch to unknown recipient "${recipient}"`);
            return;
        }
        remotes[recipient].dispatchData = data;
    };
    const close = () => {
        Object.keys(remotes).forEach((k) => delete remotes[k]);
        const _signallingPortal = signallingPortal;
        signallingPortal = undefined;
        _signallingPortal === null || _signallingPortal === void 0 ? void 0 : _signallingPortal('close', undefined);
    };
    const addIceCandidate = (candidate, remoteId) => {
        var _a;
        (_a = remotes[remoteId]) === null || _a === void 0 ? void 0 : _a.env.face.addIceCandidate(candidate);
    };
    const exchangeDescription = (description, remoteId) => {
        var _a;
        return (_a = remotes[remoteId]) === null || _a === void 0 ? void 0 : _a.env.face.exchangeDescription(description);
    };
    return {
        init,
        enter,
        dispatch,
        addIceCandidate,
        exchangeDescription,
        remotes,
        close,
    };
};
exports.createSignallingApi = createSignallingApi;
//# sourceMappingURL=signalling.js.map