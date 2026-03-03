import { CONFIG } from 'src/config-global';

import { SettingsView } from 'src/sections/settings/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`設定 - ${CONFIG.appName}`}</title>

      <SettingsView />
    </>
  );
}
