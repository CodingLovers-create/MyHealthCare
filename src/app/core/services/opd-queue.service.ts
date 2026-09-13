import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { OpdQueuePatient, Vitals, PrescriptionItem } from '../models/opd-queue.model';

@Injectable({
  providedIn: 'root'
})
export class OpdQueueService {
  private apiService = inject(ApiService);

  patients = signal<OpdQueuePatient[]>([]);

  constructor() {
    this.apiService.get<OpdQueuePatient[]>('opdQueue').subscribe(data => {
      this.patients.set(Array.isArray(data) ? data : []);
    });
  }

  getPatient(uhid: string): OpdQueuePatient | undefined {
    return this.patients().find(p => p.uhid === uhid);
  }

  /** Adds a newly-arrived patient to today's queue and persists it to db.json. */
  addPatientToQueue(patient: OpdQueuePatient): void {
    this.apiService.post<OpdQueuePatient>('opdQueue', patient).subscribe(created => {
      this.patients.update(list => [...list, created]);
    });
  }

  /**
   * json-server assigns its own record `id` on POST (ignoring any id we send), so a
   * patient added via addPatientToQueue() will have an id that differs from its uhid.
   * Every mutation below must therefore patch by the record's actual `id`, not by uhid.
   */
  private patchByUhid(uhid: string, data: Partial<OpdQueuePatient>): void {
    const current = this.getPatient(uhid);
    if (!current?.id) return;
    this.apiService.patch<OpdQueuePatient>(`opdQueue/${current.id}`, data).subscribe(updated => {
      this.patients.update(list => list.map(p => p.uhid === uhid ? { ...p, ...updated } : p));
    });
  }

  recordVitals(uhid: string, vitals: Vitals): void {
    const current = this.getPatient(uhid);
    const status = current?.status === 'Waiting' ? 'Vitals Recorded' : current?.status;
    this.patchByUhid(uhid, { vitals, status });
  }

  startConsultation(uhid: string): void {
    const current = this.getPatient(uhid);
    if (current?.status !== 'Vitals Recorded') return;
    this.patchByUhid(uhid, { status: 'In Consultation' });
  }

  updateConsultation(uhid: string, data: { complaints: string; clinicalFindings: string; diagnosis: string; prescription: PrescriptionItem[]; doctorName?: string }): void {
    this.patchByUhid(uhid, data);
  }

  completeConsultation(uhid: string): void {
    this.patchByUhid(uhid, { status: 'Completed' });
  }
}
