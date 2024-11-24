import {
  CoreSuppliers,
  createPortal,
  EtherMiddleware,
  ExtendedSuppliers,
  MicroEnv,
  Middleware,
  PortalMethod,
} from '@ceil-dev/portals';
import { createSignallingApi } from './signalling';
import { createPeersApi, PeerApi } from './peers';

type CreateWebRTCEtherProps = {
  signallingEther: EtherMiddleware;
  createRTCPeerConnection: (
    configuration?: RTCConfiguration
  ) => RTCPeerConnection;
  iceServers?: RTCIceServer[];
};

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
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

export const createWebRTCEther = ({
  signallingEther,
  createRTCPeerConnection,
  iceServers = DEFAULT_ICE_SERVERS,
}: CreateWebRTCEtherProps): EtherMiddleware => {
  let portal: PortalMethod | undefined;

  const signallingApi = createSignallingApi({
    ether: signallingEther,
    methods: {
      exchangeDescription: async (
        description: RTCSessionDescriptionInit,
        { sender }
      ) => {
        return peersApi
          .get(sender.slice(0, -7))
          .exchangeDescription(description);
      },
      addIceCandidate: async (candidate: RTCIceCandidateInit, { sender }) => {
        const rtcSender = sender.slice(0, -7);
        let peer: PeerApi;

        while (
          !(peer ||= peersApi.get(rtcSender))?.connection.remoteDescription
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        peer.connection.addIceCandidate(candidate).catch(console.warn);
      },
      pass: (data: string) => {
        portal?.('receive', data);
      },
    },
    onConnected: (id, andExchange, reset) => {
      peersApi.add(id.slice(0, -7), andExchange, reset);
    },
  });

  const peersApi = createPeersApi({
    createRTCPeerConnection,
    iceServers,
    signallingApi,
    onMessage: (data) => {
      portal?.('receive', data);
    },
  });

  return (suppliers: CoreSuppliers): ExtendedSuppliers<typeof suppliers> => ({
    ...suppliers,
    'ether.attach': ({ id, portal: _portal }, { demand, getSupplierTypes }) => {
      portal = _portal;

      const availableSupplierTypes = getSupplierTypes();
      const persistenceApi = availableSupplierTypes.includes('persistence')
        ? demand({ type: 'persistence' })
        : undefined;

      const debugSupplier = availableSupplierTypes.includes('debug' as any)
        ? (data: any) => demand({ type: 'debug', data })
        : undefined;

      signallingApi.init(id + '_signal', {
        persistenceSupplier: persistenceApi ? () => persistenceApi : undefined,
        debugSupplier,
      });
    },
    'ether.send': async ({ payload }) => {
      const { payload: data, recipient } = payload;

      // Will check if already entered
      if (!signallingApi.remotes[recipient + '_signal'])
        signallingApi.enter(recipient + '_signal');

      if (typeof data !== 'string') {
        console.warn(
          'webRtcPortal: can only dispatch string. Tried:',
          typeof data
        );
        return;
      }

      peersApi.dispatch(recipient, data);
    },
    'ether.detach': () => {
      peersApi?.removeAll();
      signallingApi.close();
    },
    'ether.restart': ({ payload: { recipient } }) => {
      // TODO: completely restart the connection with recipient
    },
  });
};

type WebRTCPortalProps = {
  signallingEther: CreateWebRTCEtherProps['signallingEther'];
  createRTCPeerConnection: CreateWebRTCEtherProps['createRTCPeerConnection'];
  iceServers: CreateWebRTCEtherProps['iceServers'];
  env: MicroEnv;
  middleware?: Middleware;
};

export const createWebRTCPortal = ({
  signallingEther,
  createRTCPeerConnection,
  iceServers,
  env,
  middleware = {},
}: WebRTCPortalProps) => {
  const portal = createPortal(env, [
    createWebRTCEther({
      signallingEther,
      createRTCPeerConnection,
      iceServers,
    }),
    middleware,
  ]);

  return portal;
};
