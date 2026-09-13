import { Injectable, signal } from '@angular/core';
import { OpdQueuePatient, Vitals, PrescriptionItem } from '../models/opd-queue.model';

@Injectable({
  providedIn: 'root'
})
export class OpdQueueService {

  patients = signal<OpdQueuePatient[]>([
    {
      uhid: 'RFH2026001', tokenNo: 'T-101', name: 'Jagdish Ramji Thakkar', ageGender: '58 Y / Male', mobile: '+91 9820198201',
      appointmentTime: '09:30 AM', doctorName: 'Dr. Susheel Bindroo', department: 'General Medicine',
      status: 'Waiting', vitals: null, complaints: '', clinicalFindings: '', diagnosis: '', prescription: [],
      history: ['07 Sep 2026 - Hypertension follow-up', '12 Jun 2026 - Annual health checkup']
    },
    {
      uhid: 'RFH2026002', tokenNo: 'T-102', name: 'Mohd. Zubair Qureshi', ageGender: '42 Y / Male', mobile: '+91 9819283746',
      appointmentTime: '09:45 AM', doctorName: 'Dr. Alok Shah', department: 'Cardiology',
      status: 'Vitals Recorded',
      vitals: { weight: '78', height: '172', bmi: '26.4', waistCircumference: '96', bpSystolic: '138', bpDiastolic: '88', map: '104.7', pulse: '82', temperature: '98.4', spo2: '97', respiratoryRate: '18', bloodGlucose: '156', painScore: '2', recordedBy: 'Nurse Kavita Rane', recordedAt: '09:40 AM' },
      complaints: '', clinicalFindings: '', diagnosis: '', prescription: [],
      history: ['08 Sep 2026 - Chest discomfort evaluation', '20 Mar 2026 - ECG review']
    },
    {
      uhid: 'RFH2026003', tokenNo: 'T-103', name: 'Anuradha Jadhav', ageGender: '35 Y / Female', mobile: '+91 9765432109',
      appointmentTime: '10:00 AM', doctorName: 'Dr. Susheel Bindroo', department: 'General Medicine',
      status: 'Waiting', vitals: null, complaints: '', clinicalFindings: '', diagnosis: '', prescription: [],
      history: ['03 Jan 2026 - Viral fever']
    },
    {
      uhid: 'RFH2026004', tokenNo: 'T-104', name: 'Rushikesh Mondkar', ageGender: '29 Y / Male', mobile: '+91 9892011223',
      appointmentTime: '10:15 AM', doctorName: 'Dr. Alok Shah', department: 'Orthopaedics',
      status: 'Vitals Recorded',
      vitals: { weight: '68', height: '175', bmi: '22.2', waistCircumference: '82', bpSystolic: '118', bpDiastolic: '76', map: '90.0', pulse: '74', temperature: '98.2', spo2: '99', respiratoryRate: '16', bloodGlucose: '98', painScore: '4', recordedBy: 'Nurse Kavita Rane', recordedAt: '10:10 AM' },
      complaints: '', clinicalFindings: '', diagnosis: '', prescription: [],
      history: ['03 Jan 2026 - Knee pain assessment']
    },
    {
      uhid: 'RFH2026005', tokenNo: 'T-105', name: 'Pooja Dhanecha', ageGender: '31 Y / Female', mobile: '+91 9123456789',
      appointmentTime: '10:30 AM', doctorName: 'Dr. Susheel Bindroo', department: 'General Medicine',
      status: 'In Consultation',
      vitals: { weight: '61', height: '160', bmi: '23.8', waistCircumference: '78', bpSystolic: '122', bpDiastolic: '80', map: '94.0', pulse: '78', temperature: '98.6', spo2: '98', respiratoryRate: '17', bloodGlucose: '110', painScore: '5', recordedBy: 'Nurse Kavita Rane', recordedAt: '10:25 AM' },
      complaints: 'Persistent headache and mild fatigue for 3 days.', clinicalFindings: '', diagnosis: '', prescription: [],
      history: ['03 Jan 2026 - Migraine consultation']
    },
    {
      uhid: 'RFH2026006', tokenNo: 'T-106', name: 'Kunal Parab', ageGender: '47 Y / Male', mobile: '+91 9988776655',
      appointmentTime: '08:45 AM', doctorName: 'Dr. Alok Shah', department: 'Cardiology',
      status: 'Completed',
      vitals: { weight: '82', height: '169', bmi: '28.7', waistCircumference: '102', bpSystolic: '132', bpDiastolic: '84', map: '100.0', pulse: '80', temperature: '98.3', spo2: '97', respiratoryRate: '18', bloodGlucose: '145', painScore: '3', recordedBy: 'Nurse Kavita Rane', recordedAt: '08:40 AM' },
      complaints: 'Occasional breathlessness on exertion.',
      clinicalFindings: 'Mild tachycardia noted. Chest clear on auscultation.',
      diagnosis: 'Stage 1 Hypertension',
      prescription: [
        { id: 'p1', medicine: 'Telmisartan 40mg', dosage: '1 Tablet', frequency: 'Once Daily', duration: '30 Days', instructions: 'After breakfast' }
      ],
      history: ['08 Sep 2026 - Routine cardiac review', '15 Feb 2026 - Lipid profile']
    },
    {
      uhid: 'RFH2026007', tokenNo: 'T-107', name: 'Ashmita Rao', ageGender: '26 Y / Female', mobile: '+91 9871234560',
      appointmentTime: '11:00 AM', doctorName: 'Dr. Susheel Bindroo', department: 'General Medicine',
      status: 'Waiting', vitals: null, complaints: '', clinicalFindings: '', diagnosis: '', prescription: [],
      history: []
    },
    {
      uhid: 'RFH2026008', tokenNo: 'T-108', name: 'Siddhi Kolekar', ageGender: '39 Y / Female', mobile: '+91 9822011234',
      appointmentTime: '11:15 AM', doctorName: 'Dr. Alok Shah', department: 'Orthopaedics',
      status: 'Waiting', vitals: null, complaints: '', clinicalFindings: '', diagnosis: '', prescription: [],
      history: ['20 Mar 2026 - Lower back pain']
    }
  ]);

  getPatient(uhid: string): OpdQueuePatient | undefined {
    return this.patients().find(p => p.uhid === uhid);
  }

  recordVitals(uhid: string, vitals: Vitals): void {
    this.patients.update(list => list.map(p =>
      p.uhid === uhid ? { ...p, vitals, status: p.status === 'Waiting' ? 'Vitals Recorded' : p.status } : p
    ));
  }

  startConsultation(uhid: string): void {
    this.patients.update(list => list.map(p =>
      p.uhid === uhid && p.status === 'Vitals Recorded' ? { ...p, status: 'In Consultation' } : p
    ));
  }

  updateConsultation(uhid: string, data: { complaints: string; clinicalFindings: string; diagnosis: string; prescription: PrescriptionItem[] }): void {
    this.patients.update(list => list.map(p =>
      p.uhid === uhid ? { ...p, ...data } : p
    ));
  }

  completeConsultation(uhid: string): void {
    this.patients.update(list => list.map(p =>
      p.uhid === uhid ? { ...p, status: 'Completed' } : p
    ));
  }
}
