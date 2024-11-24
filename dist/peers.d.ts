import { SignallingApi } from './signalling';
export type PeerApi = {
    connection: RTCPeerConnection;
    dataChannel?: RTCDataChannel;
    createOffer: () => Promise<void>;
    exchangeDescription: (description: RTCSessionDescriptionInit) => Promise<RTCSessionDescription | null>;
    send: (message: string) => true | undefined;
};
export declare const createPeersApi: ({ createRTCPeerConnection, iceServers, signallingApi, onMessage, }: {
    createRTCPeerConnection: (configuration?: RTCConfiguration) => RTCPeerConnection;
    iceServers: RTCIceServer[];
    signallingApi: SignallingApi;
    onMessage: (message: unknown) => void;
}) => {
    add: (id: string, andExchange?: boolean, reset?: boolean) => void;
    get: (id: string) => PeerApi | undefined;
    dispatch: (recipient: string, data: string) => void;
    remove: (id: string) => void;
    removeAll: () => void;
    peers: Record<string, PeerApi>;
};
