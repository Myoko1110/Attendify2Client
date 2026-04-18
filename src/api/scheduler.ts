import axios from 'axios';

import { APIError } from 'src/abc/api-error';

export type SchedulerStatus = 'running' | 'stopped' | 'unknown';

export default class Scheduler {
  static async getStatus(): Promise<SchedulerStatus> {
    try {
      const result = await axios.get('/scheduler/status');
      const data = result.data as
        | { running?: boolean; status?: string; result?: boolean }
        | boolean
        | string
        | null
        | undefined;

      if (typeof data === 'boolean') return data ? 'running' : 'stopped';
      if (typeof data === 'string') {
        const normalized = data.toLowerCase();
        if (normalized === 'running' || normalized === 'started') return 'running';
        if (normalized === 'stopped' || normalized === 'stopping') return 'stopped';
      }

      if (data && typeof data === 'object') {
        if (typeof data.running === 'boolean') return data.running ? 'running' : 'stopped';
        if (typeof data.result === 'boolean') return data.result ? 'running' : 'stopped';
        if (typeof data.status === 'string') {
          const normalized = data.status.toLowerCase();
          if (normalized === 'running' || normalized === 'started') return 'running';
          if (normalized === 'stopped' || normalized === 'stopping') return 'stopped';
        }
      }

      return 'unknown';
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async start(): Promise<void> {
    try {
      await axios.post('/scheduler/start');
    } catch (e) {
      throw APIError.fromError(e);
    }
  }

  static async stop(): Promise<void> {
    try {
      await axios.post('/scheduler/stop');
    } catch (e) {
      throw APIError.fromError(e);
    }
  }
}
