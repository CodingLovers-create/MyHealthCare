import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  public readonly baseUrl = 'http://localhost:3000';

  get<T>(endpoint: string): Observable<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.get<T>(url).pipe(
      catchError((error) => {
        console.warn(`[JSON-Server] API GET ${url} failed:`, error.message);
        return of([] as unknown as T);
      })
    );
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.post<T>(url, body).pipe(
      catchError((error) => {
        console.warn(`[JSON-Server] API POST ${url} failed:`, error.message);
        return of(body as T);
      })
    );
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.put<T>(url, body).pipe(
      catchError((error) => {
        console.warn(`[JSON-Server] API PUT ${url} failed:`, error.message);
        return of(body as T);
      })
    );
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.patch<T>(url, body).pipe(
      catchError((error) => {
        console.warn(`[JSON-Server] API PATCH ${url} failed:`, error.message);
        return of(body as T);
      })
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    return this.http.delete<T>(url).pipe(
      catchError((error) => {
        console.warn(`[JSON-Server] API DELETE ${url} failed:`, error.message);
        return of({} as T);
      })
    );
  }
}
