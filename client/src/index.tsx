import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import {mutators} from 'shared';
import {Replicache} from 'replicache';
import {createSpace, spaceExists} from './space';

async function init() {
  const {pathname} = window.location;

  if (pathname === '/' || pathname === '') {
    window.location.href = '/list/' + (await createSpace());
    return;
  }

  // URL layout is "/list/<listid>"
  const paths = pathname.split('/');
  const [, listDir, listID] = paths;
  if (
    listDir !== 'list' ||
    listID === undefined ||
    !(await spaceExists(listID))
  ) {
    window.location.href = '/';
    return;
  }

  // See https://doc.replicache.dev/licensing for how to get a license key.
  const licenseKey = import.meta.env.VITE_REPLICACHE_LICENSE_KEY;
  if (!licenseKey) {
    throw new Error('Missing VITE_REPLICACHE_LICENSE_KEY');
  }

  const r = new Replicache({
    licenseKey,
    pushURL: `/api/replicache/push?spaceID=${listID}`,
    pullURL: `/api/replicache/pull?spaceID=${listID}`,
    name: listID,
    mutators,
  });

  void r.mutate.init();

  // Implements a Replicache poke using Server-Sent Events.
  // If a "poke" message is received, it will pull from the server.
  const ev = new EventSource(`/api/replicache/poke?spaceID=${listID}`, {
    withCredentials: true,
  });
  ev.onmessage = async event => {
    if (event.data === 'poke') {
      await r.pull();
    }
  };

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App rep={r} />
    </React.StrictMode>,
  );
}
await init();
