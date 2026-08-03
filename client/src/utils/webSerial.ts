/**
 * Web Serial API Wrapper & Hardware Simulator Utility for Milk Analyzers & Weighing Scales
 * Supports reading live USB-Serial data from devices (E.g. Shiv Traders / ESSAE / EkoMilk / Lactoscan)
 * or simulated hardware stream for testing UI without physical USB hardware.
 */

export interface HardwareReadings {
  weight?: number;
  fat?: number;
  snf?: number;
  clr?: number;
  rawString?: string;
  timestamp: string;
}

export type HardwareStatus = 'disconnected' | 'connecting' | 'connected' | 'simulating';

export class SerialHardwareManager {
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private simulationInterval: any = null;

  private onDataCallback: ((readings: HardwareReadings) => void) | null = null;
  private onStatusCallback: ((status: HardwareStatus, message?: string) => void) | null = null;

  public status: HardwareStatus = 'disconnected';

  constructor() {
    this.checkBrowserSupport();
  }

  public checkBrowserSupport(): boolean {
    return 'serial' in navigator;
  }

  public setCallbacks(
    onData: (readings: HardwareReadings) => void,
    onStatus: (status: HardwareStatus, message?: string) => void
  ) {
    this.onDataCallback = onData;
    this.onStatusCallback = onStatus;
  }

  /**
   * Connect to physical USB Serial device using Web Serial API
   */
  public async connect(baudRate: number = 9600): Promise<boolean> {
    if (!this.checkBrowserSupport()) {
      if (this.onStatusCallback) {
        this.onStatusCallback(
          'disconnected',
          'Web Serial API is not supported in this browser. Use Chrome, Edge, or enable Hardware Simulator.'
        );
      }
      return false;
    }

    try {
      this.updateStatus('connecting', 'Requesting USB Serial Port access...');
      // @ts-ignore
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate });

      this.updateStatus('connected', `Connected via USB Serial (${baudRate} baud)`);
      this.startReading();
      return true;
    } catch (err: any) {
      console.error('[WebSerial Error]', err);
      this.updateStatus('disconnected', err.message || 'Failed to connect to USB device');
      return false;
    }
  }

  /**
   * Start reading data stream from connected USB port
   */
  private async startReading() {
    if (!this.port || this.isReading) return;
    this.isReading = true;

    try {
      // @ts-ignore
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      let buffer = '';

      while (this.isReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          this.reader.releaseLock();
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split(/[\r\n]+/);
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              const parsed = this.parseSerialPacket(line.trim());
              if (parsed && this.onDataCallback) {
                this.onDataCallback(parsed);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[WebSerial Read Error]', err);
      this.updateStatus('disconnected', 'Serial communication lost');
    } finally {
      this.isReading = false;
    }
  }

  /**
   * Parse common milk analyzer & weighing scale packet formats
   * Examples:
   * 1. "W:12.5,F:3.8,S:8.5"
   * 2. "WT=15.2 FAT=4.2 SNF=8.8 CLR=29"
   * 3. Plain weight: "12.5" or "12.50 KG"
   */
  private parseSerialPacket(raw: string): HardwareReadings | null {
    const result: HardwareReadings = {
      rawString: raw,
      timestamp: new Date().toISOString(),
    };

    // Pattern 1: Key-Value pair regex
    const fatMatch = raw.match(/(?:FAT|F)[:=]\s*([\d.]+)/i);
    const snfMatch = raw.match(/(?:SNF|S)[:=]\s*([\d.]+)/i);
    const weightMatch = raw.match(/(?:WT|W|WEIGHT)[:=]\s*([\d.]+)/i);
    const clrMatch = raw.match(/(?:CLR|DEGREE)[:=]\s*([\d.]+)/i);

    if (fatMatch) result.fat = parseFloat(fatMatch[1]);
    if (snfMatch) result.snf = parseFloat(snfMatch[1]);
    if (weightMatch) result.weight = parseFloat(weightMatch[1]);
    if (clrMatch) result.clr = parseFloat(clrMatch[1]);

    // Pattern 2: Plain numeric weight fallback e.g. "12.50 KG"
    if (!weightMatch) {
      const plainNum = raw.match(/^([\d.]+)\s*(?:KG|L)?$/i);
      if (plainNum) {
        result.weight = parseFloat(plainNum[1]);
      }
    }

    if (
      result.weight !== undefined ||
      result.fat !== undefined ||
      result.snf !== undefined ||
      result.clr !== undefined
    ) {
      return result;
    }

    return null;
  }

  /**
   * Hardware Simulator Mode: Emulates real-time hardware data packets
   */
  public startSimulation(intervalMs: number = 3000) {
    this.stopSimulation();
    this.updateStatus('simulating', 'Hardware Simulator Active (Generating realistic readings)');

    this.simulationInterval = setInterval(() => {
      // Generate realistic milk collection ranges
      const simWeight = Math.round((8 + Math.random() * 15) * 10) / 10; // 8.0L to 23.0L
      const simFat = Math.round((3.2 + Math.random() * 2.5) * 10) / 10; // 3.2% to 5.7%
      const simSnf = Math.round((8.2 + Math.random() * 1.0) * 10) / 10; // 8.2% to 9.2%
      const simClr = Math.round(26 + Math.random() * 5); // 26 to 31

      const readings: HardwareReadings = {
        weight: simWeight,
        fat: simFat,
        snf: simSnf,
        clr: simClr,
        rawString: `SIM [WT:${simWeight}L FAT:${simFat}% SNF:${simSnf}% CLR:${simClr}]`,
        timestamp: new Date().toISOString(),
      };

      if (this.onDataCallback) {
        this.onDataCallback(readings);
      }
    }, intervalMs);
  }

  public stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  public async disconnect() {
    this.isReading = false;
    this.stopSimulation();

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {}
      this.reader = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {}
      this.port = null;
    }

    this.updateStatus('disconnected', 'Disconnected from hardware');
  }

  private updateStatus(status: HardwareStatus, message?: string) {
    this.status = status;
    if (this.onStatusCallback) {
      this.onStatusCallback(status, message);
    }
  }
}

export const serialHardware = new SerialHardwareManager();
