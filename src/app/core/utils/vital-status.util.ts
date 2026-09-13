export type VitalStatus = 'green' | 'yellow' | 'red' | '';

export interface VitalRange {
  redLow?: number;
  yellowLow?: number;
  yellowHigh?: number;
  redHigh?: number;
}

export const VITAL_RANGES: Record<string, VitalRange> = {
  bmi: { redLow: 16, yellowLow: 18.5, yellowHigh: 24.9, redHigh: 29.9 },
  bpSystolic: { redLow: 80, yellowLow: 90, yellowHigh: 129, redHigh: 139 },
  bpDiastolic: { redLow: 50, yellowLow: 60, yellowHigh: 84, redHigh: 89 },
  map: { redLow: 60, yellowLow: 70, yellowHigh: 100, redHigh: 110 },
  pulse: { redLow: 50, yellowLow: 60, yellowHigh: 100, redHigh: 120 },
  temperature: { redLow: 95, yellowLow: 98, yellowHigh: 98.9, redHigh: 100 },
  spo2: { redLow: 91, yellowLow: 95 },
  respiratoryRate: { redLow: 8, yellowLow: 12, yellowHigh: 20, redHigh: 24 },
  bloodGlucose: { redLow: 54, yellowLow: 70, yellowHigh: 140, redHigh: 200 },
  painScore: { yellowHigh: 3, redHigh: 6 }
};

/**
 * Traffic-light classification for a vital reading.
 * Red bounds are checked before yellow bounds so the most severe band always wins,
 * regardless of the order the thresholds are declared in.
 */
export function classifyVital(raw: string | number | null | undefined, range: VitalRange): VitalStatus {
  if (raw === null || raw === undefined || raw.toString().trim() === '') return '';
  const v = typeof raw === 'number' ? raw : parseFloat(raw);
  if (isNaN(v)) return '';

  if (range.redLow !== undefined && v < range.redLow) return 'red';
  if (range.redHigh !== undefined && v > range.redHigh) return 'red';
  if (range.yellowLow !== undefined && v < range.yellowLow) return 'yellow';
  if (range.yellowHigh !== undefined && v > range.yellowHigh) return 'yellow';
  return 'green';
}

export function statusBorderClass(status: VitalStatus): string {
  switch (status) {
    case 'green': return 'border-[#3a9d5d] focus:border-[#3a9d5d]';
    case 'yellow': return 'border-[#f0a500] focus:border-[#f0a500]';
    case 'red': return 'border-[#d93848] focus:border-[#d93848]';
    default: return 'border-[#bbbbbb] focus:border-[#d93848]';
  }
}

export function statusDotClass(status: VitalStatus): string {
  switch (status) {
    case 'green': return 'bg-[#3a9d5d]';
    case 'yellow': return 'bg-[#f0a500]';
    case 'red': return 'bg-[#d93848]';
    default: return 'bg-[#cccccc]';
  }
}

export function statusTextClass(status: VitalStatus): string {
  switch (status) {
    case 'green': return 'text-[#3a9d5d]';
    case 'yellow': return 'text-[#b57b00]';
    case 'red': return 'text-[#d93848]';
    default: return 'text-[#999999]';
  }
}

export function statusLabel(status: VitalStatus): string {
  switch (status) {
    case 'green': return 'Normal';
    case 'yellow': return 'Borderline';
    case 'red': return 'Critical';
    default: return '';
  }
}
