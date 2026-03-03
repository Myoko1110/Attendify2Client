import { CONFIG } from 'src/config-global';

import { PreCheckView } from 'src/sections/pre-check-form';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`事前出欠フォーム - ${CONFIG.appName}`}</title>

      <PreCheckView />
    </>
  );
}
