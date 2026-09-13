import { PrescriptionItem } from './opd-queue.model';

export interface Visit {
  id?: string;
  visitId: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  mobile: string;
  visitDate: string;
  visitTime: string;
  doctorName: string;
  department: string;
  complaints: string;
  clinicalFindings: string;
  diagnosis: string;
  prescription: PrescriptionItem[];
}
