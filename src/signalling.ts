import {
  createPortal,
  EtherMiddleware,
  MicroEnv,
  microEnv,
  PersistenceSupplier,
  PortalMethod,
  Supplier,
} from '@ceil-dev/portals';

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

export const createSignallingApi = ({
  ether,
  methods,
  onConnected,
}: {
  ether: EtherMiddleware;
  methods: any;
  onConnected: (id: string, andExchange?: boolean, reset?: boolean) => void;
}) => {
  let signallingPortal: PortalMethod;
  const remotes: Partial<Record<string, RemoteApi>> = {};

  const init = (
    id: string,
    { persistenceSupplier, debugSupplier }: SignalingInitProps
  ) => {
    if (signallingPortal) return;

    signallingPortal = createPortal(microEnv(methods, { id }), [
      ether,
      {
        // debug: (args) => console.log(...args),
        guest: async ({ payload: { id: remoteId }, portal }) => {
          await new Promise((r) => setTimeout(r, 3000));

          if (!remotes[remoteId]) {
            const remote: RemoteApi = (remotes[remoteId] = { isGuest: true });
            remote.env = await portal('enter', remoteId);

            onConnected(remoteId, true);

            if (remote.dispatchData) {
              remote.env.face.pass(remote.dispatchData);
            }
          } else if (remotes[remoteId].isGuest) {
            // re-entry
            onConnected(remoteId, true, true);
          }
        },
        persistence: persistenceSupplier,
        debug: debugSupplier,
      },
    ]);

    signallingPortal('open');
  };

  const enter = async (remoteId: string) => {
    if (!signallingPortal) {
      console.warn(`siganling: No portal?!`);
      return;
    }

    if (remotes[remoteId]) {
      console.warn(`siganling: Tried entering known remote "${remoteId}"`);
      return;
    }

    const remote: RemoteApi = (remotes[remoteId] = {});
    remote.env = await signallingPortal('enter', remoteId);

    onConnected(remoteId);
  };

  const dispatch = (recipient: string, data: unknown) => {
    if (!remotes[recipient]) {
      console.warn(
        `WebRTC signalling: Tried to dispatch to unknown recipient "${recipient}"`
      );
      return;
    }
    remotes[recipient].dispatchData = data;
  };

  const close = () => {
    Object.keys(remotes).forEach((k) => delete remotes[k]);
    const _signallingPortal = signallingPortal;
    signallingPortal = undefined;
    _signallingPortal?.('close', undefined);
  };

  const addIceCandidate = (candidate: RTCIceCandidate, remoteId: string) => {
    remotes[remoteId]?.env.face.addIceCandidate(candidate);
  };

  const exchangeDescription = (
    description: RTCSessionDescription,
    remoteId: string
  ) => {
    return remotes[remoteId]?.env.face.exchangeDescription(
      description
    ) as Promise<RTCSessionDescription>;
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
