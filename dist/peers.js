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
exports.createPeersApi = void 0;
const createPeersApi = ({ createRTCPeerConnection, iceServers, signallingApi, onMessage, }) => {
    const peers = {};
    const dispatchData = {};
    const createPeer = (id, andExchange) => {
        const connection = createRTCPeerConnection({ iceServers });
        const peer = {
            connection,
            createOffer: () => __awaiter(void 0, void 0, void 0, function* () {
                const offer = yield peer.connection.createOffer();
                yield peer.connection.setLocalDescription(offer);
                const remoteDescription = yield signallingApi.exchangeDescription(peer.connection.localDescription, id + '_signal');
                yield peer.connection.setRemoteDescription(remoteDescription);
            }),
            exchangeDescription: (description) => __awaiter(void 0, void 0, void 0, function* () {
                yield peer.connection.setRemoteDescription(description);
                const answer = yield peer.connection.createAnswer();
                yield peer.connection.setLocalDescription(answer);
                return peer.connection.localDescription;
            }),
            send: (message) => {
                var _a;
                if (((_a = peer.dataChannel) === null || _a === void 0 ? void 0 : _a.readyState) === 'open') {
                    peer.dataChannel.send(message);
                    return true;
                }
            },
        };
        const setDataChannel = (channel) => {
            peer.dataChannel = channel;
            peer.dataChannel.onmessage = (event) => {
                onMessage(event.data);
            };
            peer.dataChannel.onopen = () => {
                const data = dispatchData[id];
                if (data) {
                    delete dispatchData[id];
                    peer.dataChannel.send(data);
                }
            };
        };
        peer.connection.onicecandidate = (event) => {
            if (event.candidate) {
                signallingApi.addIceCandidate(event.candidate, id + '_signal');
            }
        };
        if (andExchange) {
            peer.connection.onconnectionstatechange = (event) => {
                if (peer.connection.connectionState === 'failed') {
                    peer.createOffer();
                }
            };
            setDataChannel(peer.connection.createDataChannel('messagingChannel'));
            peer.createOffer();
        }
        else {
            peer.connection.ondatachannel = (event) => {
                setDataChannel(event.channel);
            };
        }
        return peer;
    };
    const api = {
        add: (id, andExchange, reset) => {
            if (reset && peers[id]) {
                api.remove(id);
            }
            if (!peers[id]) {
                peers[id] = createPeer(id, andExchange);
            }
        },
        get: (id) => {
            return peers[id];
        },
        dispatch: (recipient, data) => {
            var _a;
            if ((_a = peers[recipient]) === null || _a === void 0 ? void 0 : _a.send(data)) {
                delete dispatchData[recipient];
                return;
            }
            dispatchData[recipient] = data;
        },
        remove: (id) => {
            const peer = peers[id];
            if (peer) {
                if (peer.dataChannel) {
                    peer.dataChannel.onmessage = null;
                    peer.dataChannel.onopen = null;
                    peer.dataChannel.close();
                }
                peer.connection.onconnectionstatechange = null;
                peer.connection.ondatachannel = null;
                peer.connection.onicecandidate = null;
                peer.connection.close();
                delete peers[id];
            }
        },
        removeAll: () => {
            Object.keys(peers).forEach(api.remove);
        },
        peers,
    };
    return api;
};
exports.createPeersApi = createPeersApi;
//# sourceMappingURL=peers.js.map