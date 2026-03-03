import { CONFIG } from 'src/config-global';

import { ForbiddenView } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`アクセス拒否 - ${CONFIG.appName}`}</title>

      <ForbiddenView />
    </>
  );
}
