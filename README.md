# WebRTC Portal

_Create WebRTC portals and ether_

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Example](#example)
5. [License](#license)

---

## Overview

Creates configurable WebRTC portals and ether.

---

## Installation

```bash
# Clone the repository
npm install @ceil-dev/webrtc-portal
```

---

### Usage

```javascript
import { createWebRTCPortal, createWebRTCEther } from '@ceil-dev/webrtc-portal';
```

---

### Example

Run this example in an environment with built-in RTCPeerConnection class or use a library.
Also for signalling install `@ceil-dev/web-point-portal` or use other available or custom Ethers.

```typescript
import { createWebPointEther } from '@ceil-dev/web-point-portal';
import { createWebRTCPortal, createWebRTCEther } from '@ceil-dev/webrtc-portal';

const run = async () => {
  const portalB = createPortal(
    microEnv(
      // the object to expose
      { 
        foo: 'not bar',
        sayHi: (msg: string) => console.log(msg)
      },
      { id: 'INSERT_YOUR_UNIQUE_UUID' },
    ),
    [
      createWebRTCEther({
        signallingEther: createWebPointEther({ fetchMethod: fetch }),
        createRTCPeerConnection: (conf) => new RTCPeerConnection(conf),
      }),
      {
        guest: async ({ payload: { id }, portal }) => {
          console.log(portalB.descriptor.id, 'visited by', id);
        },
      },
    ]
  );

  await portalB('open');

  // Enter this portal using other WebRTC portal or Portals App (https://ceil.dev/apps#portals)
};

run().catch(console.warn);
```

---

### License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
