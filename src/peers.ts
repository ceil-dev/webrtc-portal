import { SignallingApi } from './signalling';

export type PeerApi = {
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  createOffer: () => Promise<void>;
  exchangeDescription: (
    description: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescription | null>;
  send: (message: string) => true | undefined;
};

export const createPeersApi = ({
  createRTCPeerConnection,
  iceServers,
  signallingApi,
  onMessage,
}: {
  createRTCPeerConnection: (
    configuration?: RTCConfiguration
  ) => RTCPeerConnection;
  iceServers: RTCIceServer[];
  signallingApi: SignallingApi;
  onMessage: (message: unknown) => void;
}) => {
  const peers: Record<string, PeerApi> = {};
  const dispatchData: Record<string, string> = {};

  const createPeer = (id: string, andExchange?: boolean): PeerApi => {
    const connection = createRTCPeerConnection({ iceServers });

    const peer: PeerApi = {
      connection,
      createOffer: async () => {
        const offer = await peer.connection.createOffer();
        await peer.connection.setLocalDescription(offer);
        const remoteDescription = await signallingApi.exchangeDescription(
          peer.connection.localDescription,
          id + '_signal'
        );

        await peer.connection.setRemoteDescription(remoteDescription);
      },
      exchangeDescription: async (description) => {
        await peer.connection.setRemoteDescription(description);
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        return peer.connection.localDescription;
      },
      send: (message: string) => {
        if (peer.dataChannel?.readyState === 'open') {
          peer.dataChannel.send(message);
          return true;
        }
      },
    };

    const setDataChannel = (channel: RTCDataChannel) => {
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
    } else {
      peer.connection.ondatachannel = (event) => {
        setDataChannel(event.channel);
      };
    }

    return peer;
  };

  const api = {
    add: (id: string, andExchange?: boolean, reset?: boolean) => {
      if (reset && peers[id]) {
        api.remove(id);
      }

      if (!peers[id]) {
        peers[id] = createPeer(id, andExchange);
      }
    },
    get: (id: string): PeerApi | undefined => {
      return peers[id];
    },
    dispatch: (recipient: string, data: string) => {
      if (peers[recipient]?.send(data)) {
        // success
        delete dispatchData[recipient];
        return;
      }
      dispatchData[recipient] = data;
    },
    remove: (id: string) => {
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
