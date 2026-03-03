import { CONFIG } from 'src/config-global';

import { PreCheckView } from '../sections/pre-check/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`事前出欠 - ${CONFIG.appName}`}</title>

      <PreCheckView />
    </>
  );
}
