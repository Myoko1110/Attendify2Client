// Minimal WebUSB type declarations to satisfy TS when lib.dom doesn't include WebUSB
// Only the parts used by src/felica/felica-reader.ts are declared here.

declare global {
  interface USBDevice {
    productId: number;
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    configuration?: USBConfiguration | null;
    claimInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
    transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
  }

  interface USBConfiguration {
    interfaces: USBInterface[];
  }

  interface USBInterface {
    interfaceNumber: number;
    alternate: USBAlternateInterface;
  }

  interface USBAlternateInterface {
    interfaceClass: number;
    endpoints: USBEndpoint[];
  }

  interface USBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
  }

  interface USBInTransferResult {
    data: DataView | null;
  }

  interface USBOutTransferResult {
    status?: string;
  }

  interface USB {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options: { filters: Array<{ vendorId?: number; productId?: number; deviceModel?: number }>; }): Promise<USBDevice>;
  }

  interface Navigator {
    usb?: USB;
  }
}

export {};