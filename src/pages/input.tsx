import { CONFIG } from 'src/config-global';

import { InputView } from 'src/sections/input/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`入力 - ${CONFIG.appName}`}</title>

      <InputView />
    </>
  );
}
