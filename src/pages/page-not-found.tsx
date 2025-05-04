import { CONFIG } from 'src/config-global';

import { NotFoundView } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Error - ${CONFIG.appName}`}</title>

      <NotFoundView />
    </>
  );
}
