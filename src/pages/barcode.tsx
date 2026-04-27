import { CONFIG } from 'src/config-global';

import { BarcodeReader } from 'src/sections/barcode';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`バーコード - ${CONFIG.appName}`}</title>

      <BarcodeReader />
    </>
  );
}
