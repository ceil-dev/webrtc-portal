import { EtherMiddleware, MicroEnv, PersistenceSupplier, Supplier } from '@ceil-dev/portals';
type RemoteApi = {
    env?: MicroEnv;
    dispatchData?: unknown;
    isGuest?: boolean;
};
export type SignallingApi = ReturnType<typeof createSignallingApi>;
type SignalingInitProps = {
    persistenceSupplier: PersistenceSupplier;
    debugSupplier: Supplier;
};
export declare const createSignallingApi: ({ ether, methods, onConnected, }: {
    ether: EtherMiddleware;
    methods: any;
    onConnected: (id: string, andExchange?: boolean, reset?: boolean) => void;
}) => {
    init: (id: string, { persistenceSupplier, debugSupplier }: SignalingInitProps) => void;
    enter: (remoteId: string) => Promise<void>;
    dispatch: (recipient: string, data: unknown) => void;
    addIceCandidate: (candidate: RTCIceCandidate, remoteId: string) => void;
    exchangeDescription: (description: RTCSessionDescription, remoteId: string) => Promise<RTCSessionDescription>;
    remotes: Partial<Record<string, RemoteApi>>;
    close: () => void;
};
export {};
