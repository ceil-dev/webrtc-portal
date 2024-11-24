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
exports.createWebRTCPortal = exports.createWebRTCEther = void 0;
const portals_1 = require("@ceil-dev/portals");
const signalling_1 = require("./signalling");
const peers_1 = require("./peers");
const DEFAULT_ICE_SERVERS = [
    {
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302',
        ],
    },
];
const createWebRTCEther = ({ signallingEther, createRTCPeerConnection, iceServers = DEFAULT_ICE_SERVERS, }) => {
    let portal;
    const signallingApi = (0, signalling_1.createSignallingApi)({
        ether: signallingEther,
        methods: {
            exchangeDescription: (description_1, _a) => __awaiter(void 0, [description_1, _a], void 0, function* (description, { sender }) {
                return peersApi
                    .get(sender.slice(0, -7))
                    .exchangeDescription(description);
            }),
            addIceCandidate: (candidate_1, _a) => __awaiter(void 0, [candidate_1, _a], void 0, function* (candidate, { sender }) {
                var _b;
                const rtcSender = sender.slice(0, -7);
                let peer;
                while (!((_b = (peer || (peer = peersApi.get(rtcSender)))) === null || _b === void 0 ? void 0 : _b.connection.remoteDescription)) {
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                }
                peer.connection.addIceCandidate(candidate).catch(console.warn);
            }),
            pass: (data) => {
                portal === null || portal === void 0 ? void 0 : portal('receive', data);
            },
        },
        onConnected: (id, andExchange, reset) => {
            peersApi.add(id.slice(0, -7), andExchange, reset);
        },
    });
    const peersApi = (0, peers_1.createPeersApi)({
        createRTCPeerConnection,
        iceServers,
        signallingApi,
        onMessage: (data) => {
            portal === null || portal === void 0 ? void 0 : portal('receive', data);
        },
    });
    return (suppliers) => (Object.assign(Object.assign({}, suppliers), { 'ether.attach': ({ id, portal: _portal }, { demand, getSupplierTypes }) => {
            portal = _portal;
            const availableSupplierTypes = getSupplierTypes();
            const persistenceApi = availableSupplierTypes.includes('persistence')
                ? demand({ type: 'persistence' })
                : undefined;
            const debugSupplier = availableSupplierTypes.includes('debug')
                ? (data) => demand({ type: 'debug', data })
                : undefined;
            signallingApi.init(id + '_signal', {
                persistenceSupplier: persistenceApi ? () => persistenceApi : undefined,
                debugSupplier,
            });
        }, 'ether.send': (_a) => __awaiter(void 0, [_a], void 0, function* ({ payload }) {
            const { payload: data, recipient } = payload;
            if (!signallingApi.remotes[recipient + '_signal'])
                signallingApi.enter(recipient + '_signal');
            if (typeof data !== 'string') {
                console.warn('webRtcPortal: can only dispatch string. Tried:', typeof data);
                return;
            }
            peersApi.dispatch(recipient, data);
        }), 'ether.detach': () => {
            peersApi === null || peersApi === void 0 ? void 0 : peersApi.removeAll();
            signallingApi.close();
        }, 'ether.restart': ({ payload: { recipient } }) => {
        } }));
};
exports.createWebRTCEther = createWebRTCEther;
const createWebRTCPortal = ({ signallingEther, createRTCPeerConnection, iceServers, env, middleware = {}, }) => {
    const portal = (0, portals_1.createPortal)(env, [
        (0, exports.createWebRTCEther)({
            signallingEther,
            createRTCPeerConnection,
            iceServers,
        }),
        middleware,
    ]);
    return portal;
};
exports.createWebRTCPortal = createWebRTCPortal;
//# sourceMappingURL=index.js.map