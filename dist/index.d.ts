import { EtherMiddleware, MicroEnv, Middleware, PortalMethod } from '@ceil-dev/portals';
type CreateWebRTCEtherProps = {
    signallingEther: EtherMiddleware;
    createRTCPeerConnection: (configuration?: RTCConfiguration) => RTCPeerConnection;
    iceServers?: RTCIceServer[];
};
export declare const createWebRTCEther: ({ signallingEther, createRTCPeerConnection, iceServers, }: CreateWebRTCEtherProps) => EtherMiddleware;
type WebRTCPortalProps = {
    signallingEther: CreateWebRTCEtherProps['signallingEther'];
    createRTCPeerConnection: CreateWebRTCEtherProps['createRTCPeerConnection'];
    iceServers: CreateWebRTCEtherProps['iceServers'];
    env: MicroEnv;
    middleware?: Middleware;
};
export declare const createWebRTCPortal: ({ signallingEther, createRTCPeerConnection, iceServers, env, middleware, }: WebRTCPortalProps) => PortalMethod;
export {};
