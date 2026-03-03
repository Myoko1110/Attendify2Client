import { CONFIG } from 'src/config-global';

import { FelicaView } from 'src/sections/felica';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`IC - ${CONFIG.appName}`}</title>

      <FelicaView />
    </>
  );
}
