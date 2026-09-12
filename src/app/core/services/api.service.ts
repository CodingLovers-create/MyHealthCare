import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  get<T>(endpoint: string): Observable<ApiResponse<T>> {
    console.log(`[API GET] ${endpoint}`);
    return of({
      success: true,
      message: 'Data retrieved successfully',
      data: [] as unknown as T,
      timestamp: new Date().toISOString()
    });
  }

  post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
    console.log(`[API POST] ${endpoint}`, body);
    return of({
      success: true,
      message: 'Operation executed successfully',
      data: body as T,
      timestamp: new Date().toISOString()
    });
  }
}
