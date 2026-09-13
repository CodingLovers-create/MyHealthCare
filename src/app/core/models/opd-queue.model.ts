export interface Vitals {
  weight: string;
  height: string;
  bmi: string;
  waistCircumference: string;
  bpSystolic: string;
  bpDiastolic: string;
  map: string;
  pulse: string;
  temperature: string;
  spo2: string;
  respiratoryRate: string;
  bloodGlucose: string;
  painScore: string;
  recordedBy: string;
  recordedAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export type OpdQueueStatus = 'Waiting' | 'Vitals Recorded' | 'In Consultation' | 'Completed';

export interface OpdQueuePatient {
  uhid: string;
  tokenNo: string;
  name: string;
  ageGender: string;
  mobile: string;
  appointmentTime: string;
  doctorName: string;
  department: string;
  status: OpdQueueStatus;
  vitals: Vitals | null;
  complaints: string;
  clinicalFindings: string;
  diagnosis: string;
  prescription: PrescriptionItem[];
  history: string[];
}
