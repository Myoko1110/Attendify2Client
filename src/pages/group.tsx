import { CONFIG } from 'src/config-global';

import { GroupView } from 'src/sections/group/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`グループ - ${CONFIG.appName}`}</title>

      <GroupView />
    </>
  );
}
