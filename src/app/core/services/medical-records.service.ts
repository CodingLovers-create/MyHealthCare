import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Visit } from '../models/visit.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordsService {
  private apiService = inject(ApiService);

  saveVisit(visit: Visit): Observable<Visit> {
    return this.apiService.post<Visit>('visits', visit);
  }

  getVisitsByUhid(uhid: string): Observable<Visit[]> {
    return this.apiService.get<Visit[]>(`visits?uhid=${encodeURIComponent(uhid)}`);
  }
}
