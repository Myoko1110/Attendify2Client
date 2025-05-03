import { CONFIG } from 'src/config-global';

import { ScheduleView } from 'src/sections/schedule/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`予定 - ${CONFIG.appName}`}</title>

      <ScheduleView />
    </>
  );
}
