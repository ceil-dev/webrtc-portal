// import { createWebPointEther } from '@ceil-dev/web-point-portal';
// import { createWebRTCPortal, createWebRTCEther } from '@ceil-dev/webrtc-portal';

const run = async () => {
  // const portalB = createPortal(
  //   microEnv(
  //     // the object to expose
  //     {
  //       foo: 'not bar',
  //       sayHi: (msg: string) => console.log(msg)
  //     },
  //     { id: 'INSERT_YOUR_UNIQUE_UUID' },
  //   ),
  //   [
  //     createWebRTCEther({
  //       signallingEther: createWebPointEther({ fetchMethod: fetch }),
  //       createRTCPeerConnection: (conf) => new RTCPeerConnection(conf),
  //     }),
  //     {
  //       guest: async ({ payload: { id }, portal }) => {
  //         console.log(portalB.descriptor.id, 'visited by', id);
  //       },
  //     },
  //   ]
  // );
  // await portalB('open');
  // // Enter this portal using other WebRTC portal or Portals App (https://ceil.dev/apps#portals)
};

run().catch(console.warn);
