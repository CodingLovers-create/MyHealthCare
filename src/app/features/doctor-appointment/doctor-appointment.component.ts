import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { OpdQueueService } from '../../core/services/opd-queue.service';
import { OpdQueuePatient } from '../../core/models/opd-queue.model';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { UhidFormatPipe } from '../../shared/pipes/uhid-format.pipe';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { CardContainerComponent, CardHeaderDirective, CardBodyDirective } from '../../shared/components/card-container/card-container.component';

export interface TimeSlot {
  time: string;
  type: 'walkin' | 'normal' | 'emergency' | 'blocked' | 'premium' | 'free' | 'phc';
  isBooked?: boolean;
  isAvailable?: boolean;
  patientName?: string;
  patientUhid?: string;
  patientMobile?: string;
  visitId?: string;
  reason?: string;
}

export interface Practitioner {
  id: string;
  name: string;
  speciality: string;
  fee: number;
}

export interface HospitalServiceItem {
  id: string;
  name: string;
  department: string;
  fee: number;
}

@Component({
  selector: 'app-doctor-appointment',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    NavbarComponent,
    SubheaderComponent,
    UhidFormatPipe,
    InrCurrencyPipe,
    CardContainerComponent,
    CardHeaderDirective,
    CardBodyDirective
  ],
  templateUrl: './doctor-appointment.component.html'
})
export class DoctorAppointmentComponent implements OnInit {
  // @ViewChild references
  @ViewChild('patientSearchInput') patientSearchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('patientSelect') patientSelectRef?: ElementRef<HTMLSelectElement>;

  focusSearchInput(): void {
    if (this.patientSearchInputRef?.nativeElement) {
      this.patientSearchInputRef.nativeElement.focus();
      this.toastService.info('Focused Patient Search Input.');
    }
  }
  private apiService = inject(ApiService);
  private queueService = inject(OpdQueueService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  public sidebarService = inject(SidebarService);
  public authService = inject(AuthService);

  activeModuleTab = signal<string>('DoctorAppointment');
  appointmentType = signal<'doctor' | 'service'>('doctor');
  scheduleViewMode = signal<'table' | 'grid'>('table');

  // Filter signals
  mobileNo = signal<string>('');
  phoneType = signal<'Mobile' | 'Phone'>('Mobile');
  selectedFacility = signal<string>('Reliance Foundation Hospital Trust');
  selectedPatient = signal<string>('');
  selectedSpeciality = signal<string>('All');
  selectedPractitioner = signal<string>('all');
  selectedMode = signal<string>('OP');
  selectedService = signal<string>('General OPD');
  payorType = signal<string>('Self');

  // Service Appointment Signals & State
  selectedServiceDepartment = signal<string>('All Departments');
  selectedServices = signal<HospitalServiceItem[]>([]);

  // Calendar State
  private todayNow = new Date();
  currentYear = signal<number>(this.todayNow.getFullYear());
  currentMonth = signal<number>(this.todayNow.getMonth());
  selectedDate = signal<number>(this.todayNow.getDate());

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  shortDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  shortMonthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  isPastDate(dayNum: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(this.currentYear(), this.currentMonth(), dayNum, 0, 0, 0, 0);
    return target < today;
  }

  getSlotDateTime(dayDate: Date, timeStr: string): Date {
    const parts = timeStr.split(' ');
    const time = parts[0];
    const modifier = parts[1] || 'AM';
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hours, minutes, 0, 0);
  }

  parseSlotDateTime(dateLabel: string, timeStr: string): Date | null {
    if (!dateLabel || !timeStr) return null;
    const parts = dateLabel.trim().split(/\s+/);
    if (parts.length >= 3) {
      const dayNum = parseInt(parts[1], 10);
      const monthStr = parts[2].toUpperCase();
      const monthIndex = this.shortMonthNames.indexOf(monthStr);
      let year = this.currentYear();
      if (parts.length >= 4 && !isNaN(parseInt(parts[3], 10))) {
        year = parseInt(parts[3], 10);
      }
      if (monthIndex !== -1 && !isNaN(dayNum)) {
        const dayDate = new Date(year, monthIndex, dayNum);
        return this.getSlotDateTime(dayDate, timeStr);
      }
    }
    return null;
  }

  isSlotInPast(dateLabel: string, timeStr: string): boolean {
    const slotDt = this.parseSlotDateTime(dateLabel, timeStr);
    if (!slotDt) return false;
    return slotDt < new Date();
  }

  get daysInCurrentMonth(): number[] {
    const totalDays = new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }

  get startPaddingDays(): number[] {
    const firstDayOfWeek = new Date(this.currentYear(), this.currentMonth(), 1).getDay();
    const prevMonthDays = new Date(this.currentYear(), this.currentMonth(), 0).getDate();
    const padding: number[] = [];       
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      padding.push(prevMonthDays - i);
    }
    return padding;
  }

  selectDate(dayNum: number): void {
    if (this.isPastDate(dayNum)) {
      this.toastService.warning('Past dates cannot be selected for appointment booking.');
      return;
    }
    this.selectedDate.set(dayNum);
  }

  prevMonth(): void {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    
    if (this.currentYear() === curYear && this.currentMonth() <= curMonth) {
      this.toastService.warning('Cannot navigate to past months for appointment booking.');
      return;
    }

    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }

    if (this.currentYear() === curYear && this.currentMonth() === curMonth) {
      this.selectedDate.set(now.getDate());
    } else {
      this.selectedDate.set(1);
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(m => m + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedDate.set(1);
  }

  // Slot Booking Modal State
  selectedSlot = signal<{ dateStr: string; time: string; practitioner: string; fee: number; servicesSummary?: string } | null>(null);
  showBookingModal = signal<boolean>(false);
  patientName = signal<string>('');
  patientMobile = signal<string>('');

  allAvailableTimes: string[] = [
    '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
    '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
    '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
    '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
    '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
    '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
    '05:00 PM', '05:30 PM', '06:00 PM'
  ];

  practitioners: Practitioner[] = [
    { id: '1', name: 'Dr. Susheel Bindroo', speciality: 'Pulmonology', fee: 1500 },
    { id: '2', name: 'Dr. Alok Shah', speciality: 'Cardiology', fee: 2000 },
    { id: '3', name: 'Dr. Sneha Patil', speciality: 'General Medicine', fee: 1000 },
    { id: '4', name: 'Dr. Rajesh Sharma', speciality: 'Orthopedics', fee: 1800 },
    { id: '5', name: 'Dr. Meera Iyer', speciality: 'Pediatrics', fee: 1200 },
    { id: '6', name: 'Dr. Vikram Seth', speciality: 'Dermatology', fee: 1400 },
    { id: '7', name: 'Dr. Ananya Roy', speciality: 'Neurology', fee: 2200 },
    { id: '8', name: 'Dr. Pankaj Gupta', speciality: 'Cardiology', fee: 1900 },
    { id: '9', name: 'Dr. Ritu Verma', speciality: 'Pulmonology', fee: 1600 }
  ];

  specialities = ['All', 'Pulmonology', 'Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Neurology'];

  serviceDepartments = [
    'All Departments',
    'Pathology & Laboratory',
    'Radiology & Imaging',
    'Cardiology Diagnostics',
    'Physiotherapy & Rehab',
    'Executive Health Packages'
  ];

  servicesList: HospitalServiceItem[] = [
    // Pathology & Laboratory
    { id: 's1', name: 'Complete Blood Count (CBC)', department: 'Pathology & Laboratory', fee: 350 },
    { id: 's2', name: 'Fasting Blood Sugar (FBS) & HbA1c', department: 'Pathology & Laboratory', fee: 450 },
    { id: 's3', name: 'Lipid Profile (Cholesterol)', department: 'Pathology & Laboratory', fee: 650 },
    { id: 's4', name: 'Liver Function Test (LFT)', department: 'Pathology & Laboratory', fee: 750 },
    { id: 's5', name: 'Kidney Function Test (KFT)', department: 'Pathology & Laboratory', fee: 700 },
    { id: 's6', name: 'Thyroid Profile (T3, T4, TSH)', department: 'Pathology & Laboratory', fee: 550 },

    // Radiology & Imaging
    { id: 's7', name: 'Chest X-Ray PA View', department: 'Radiology & Imaging', fee: 500 },
    { id: 's8', name: 'USG Abdomen & Pelvis', department: 'Radiology & Imaging', fee: 1200 },
    { id: 's9', name: 'CT Scan Brain Non-Contrast', department: 'Radiology & Imaging', fee: 2500 },
    { id: 's10', name: 'MRI Brain 1.5T', department: 'Radiology & Imaging', fee: 4500 },
    { id: 's11', name: 'Digital Mammography', department: 'Radiology & Imaging', fee: 1800 },

    // Cardiology Diagnostics
    { id: 's12', name: 'ECG 12-Lead', department: 'Cardiology Diagnostics', fee: 300 },
    { id: 's13', name: '2D Echocardiography', department: 'Cardiology Diagnostics', fee: 1800 },
    { id: 's14', name: 'Treadmill Stress Test (TMT)', department: 'Cardiology Diagnostics', fee: 2200 },
    { id: 's15', name: '24-Hour Holter Monitoring', department: 'Cardiology Diagnostics', fee: 2800 },

    // Physiotherapy & Rehab
    { id: 's16', name: 'Post-Op Physical Therapy Session', department: 'Physiotherapy & Rehab', fee: 800 },
    { id: 's17', name: 'Cervical & Spine Traction', department: 'Physiotherapy & Rehab', fee: 600 },
    { id: 's18', name: 'Neurological Rehabilitation', department: 'Physiotherapy & Rehab', fee: 1000 },

    // Executive Health Packages
    { id: 's19', name: 'Master Cardiac Health Checkup', department: 'Executive Health Packages', fee: 3500 },
    { id: 's20', name: 'Full Body Wellness Profile', department: 'Executive Health Packages', fee: 4200 }
  ];

  filteredPractitioners = computed(() => {
    const spec = this.selectedSpeciality();
    if (!spec || spec === 'All') {
      return this.practitioners;
    }
    return this.practitioners.filter(p => p.speciality.toLowerCase() === spec.toLowerCase());
  });

  filteredServicesList = computed(() => {
    const dept = this.selectedServiceDepartment();
    if (!dept || dept === 'All Departments') {
      return this.servicesList;
    }
    return this.servicesList.filter(s => s.department === dept);
  });

  consultationFee = computed(() => {
    if (this.appointmentType() === 'service') {
      const selected = this.selectedServices();
      if (selected.length === 0) return 500; // default base test fee
      return selected.reduce((sum, item) => sum + item.fee, 0);
    }
    const docId = this.selectedPractitioner();
    if (!docId || docId === 'all') return 0;
    const doc = this.practitioners.find(p => p.id === docId);
    return doc ? doc.fee : 0;
  });

  onSpecialityChange(newSpec: string): void {
    this.selectedSpeciality.set(newSpec);
    this.selectedPractitioner.set('all');
  }

  onServiceDepartmentChange(dept: string): void {
    this.selectedServiceDepartment.set(dept);
  }

  addServiceToSelection(serviceId: string): void {
    if (!serviceId) return;
    const item = this.servicesList.find(s => s.id === serviceId);
    if (!item) return;

    const current = this.selectedServices();
    if (!current.some(s => s.id === serviceId)) {
      this.selectedServices.set([...current, item]);
      this.toastService.info(`Added "${item.name}" (INR ${item.fee})`);
    }
  }

  removeService(serviceId: string): void {
    const current = this.selectedServices();
    this.selectedServices.set(current.filter(s => s.id !== serviceId));
  }

  isServiceSelected(serviceId: string): boolean {
    return this.selectedServices().some(s => s.id === serviceId);
  }

  // Map of Doctor-Specific Schedules keyed by Practitioner ID
  doctorSchedulesMap: Record<string, { dateLabel: string; slots: TimeSlot[] }[]> = {
    // 1. Dr. Susheel Bindroo (Pulmonology)
    '1': [
      {
        dateLabel: 'SAT 12 SEP',
        slots: [
          { time: '09:00 AM', type: 'walkin', isAvailable: true },
          { time: '09:15 AM', type: 'normal', isAvailable: true },
          { time: '09:30 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Jagdish Ramji Thakkar', patientUhid: 'RFH2026001', patientMobile: '9820198201', reason: 'Pulmonary OPD Followup' },
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'emergency', isAvailable: false, isBooked: true, patientName: 'Anuradha Jadhav', patientUhid: 'RFH2026003', patientMobile: '9765432109', reason: 'Acute Asthma Emergency' },
          { time: '11:00 AM', type: 'premium', isAvailable: true },
          { time: '11:30 AM', type: 'normal', isAvailable: true },
          { time: '02:00 PM', type: 'walkin', isAvailable: true },
          { time: '02:30 PM', type: 'free', isAvailable: true },
          { time: '03:00 PM', type: 'phc', isAvailable: false, isBooked: true, patientName: 'Pooja Dhanecha', patientUhid: 'RFH2026005', patientMobile: '9123456789', reason: 'Routine Health Checkup' }
        ]
      },
      {
        dateLabel: 'SUN 13 SEP',
        slots: [
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:00 AM', type: 'normal', isAvailable: true },
          { time: '11:30 AM', type: 'premium', isAvailable: true },
          { time: '02:00 PM', type: 'emergency', isAvailable: false, isBooked: true, patientName: 'Jagdish Ramji Thakkar', patientUhid: 'RFH2026001', patientMobile: '9820198201', reason: 'Bronchoscopy Review' }
        ]
      },
      {
        dateLabel: 'MON 14 SEP',
        slots: [
          { time: '09:00 AM', type: 'normal', isAvailable: true },
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'walkin', isAvailable: false, isBooked: true, patientName: 'Anuradha Jadhav', patientUhid: 'RFH2026003', patientMobile: '9765432109', reason: 'Walkin Consultation' },
          { time: '11:00 AM', type: 'normal', isAvailable: true }
        ]
      }
    ],

    // 2. Dr. Alok Shah (Cardiology)
    '2': [
      {
        dateLabel: 'SAT 12 SEP',
        slots: [
          { time: '08:30 AM', type: 'normal', isAvailable: true },
          { time: '09:00 AM', type: 'normal', isAvailable: true },
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:00 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Jagdish Ramji Thakkar', patientUhid: 'RFH2026001', patientMobile: '9820198201', reason: 'ECG & Echo Review' },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:00 AM', type: 'premium', isAvailable: true },
          { time: '11:30 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Pooja Dhanecha', patientUhid: 'RFH2026005', patientMobile: '9123456789', reason: 'Hypertension Followup' },
          { time: '02:30 PM', type: 'normal', isAvailable: true },
          { time: '03:00 PM', type: 'walkin', isAvailable: true }
        ]
      },
      {
        dateLabel: 'SUN 13 SEP',
        slots: [
          { time: '09:00 AM', type: 'normal', isAvailable: true },
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Mohd. Zubair Qureshi', patientUhid: 'RFH2026002', patientMobile: '9819283746', reason: 'Angiography Followup' },
          { time: '11:30 AM', type: 'premium', isAvailable: true }
        ]
      },
      {
        dateLabel: 'MON 14 SEP',
        slots: [
          { time: '08:30 AM', type: 'normal', isAvailable: true },
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:30 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Pooja Dhanecha', patientUhid: 'RFH2026005', patientMobile: '9123456789', reason: 'TMT Test Review' }
        ]
      }
    ],

    // 3. Dr. Sneha Patil (General Medicine)
    '3': [
      {
        dateLabel: 'SAT 12 SEP',
        slots: [
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Anuradha Jadhav', patientUhid: 'RFH2026003', patientMobile: '9765432109', reason: 'General OPD Consult' },
          { time: '11:00 AM', type: 'normal', isAvailable: true },
          { time: '11:30 AM', type: 'normal', isAvailable: true },
          { time: '12:00 PM', type: 'premium', isAvailable: true },
          { time: '02:00 PM', type: 'walkin', isAvailable: true },
          { time: '02:30 PM', type: 'normal', isAvailable: true },
          { time: '03:00 PM', type: 'normal', isAvailable: true }
        ]
      },
      {
        dateLabel: 'SUN 13 SEP',
        slots: [
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:00 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Mr. PRATHAMESH SHASHANK KHOCHADE', patientUhid: 'RFH23241854', patientMobile: '9892011223', reason: 'General Health Review' }
        ]
      },
      {
        dateLabel: 'MON 14 SEP',
        slots: [
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:30 AM', type: 'normal', isAvailable: true }
        ]
      }
    ],

    // 4. Dr. Rajesh Sharma (Orthopedics)
    '4': [
      {
        dateLabel: 'SAT 12 SEP',
        slots: [
          { time: '09:00 AM', type: 'normal', isAvailable: true },
          { time: '09:45 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:15 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Pooja Dhanecha', patientUhid: 'RFH2026005', patientMobile: '9123456789', reason: 'Joint Pain OPD' },
          { time: '02:00 PM', type: 'walkin', isAvailable: true },
          { time: '02:45 PM', type: 'normal', isAvailable: true },
          { time: '03:30 PM', type: 'normal', isAvailable: true }
        ]
      },
      {
        dateLabel: 'SUN 13 SEP',
        slots: [
          { time: '09:45 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:15 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Anuradha Jadhav', patientUhid: 'RFH2026003', patientMobile: '9765432109', reason: 'Orthopedic Consult' }
        ]
      },
      {
        dateLabel: 'MON 14 SEP',
        slots: [
          { time: '09:00 AM', type: 'normal', isAvailable: true },
          { time: '09:45 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true }
        ]
      }
    ],

    // 5. Dr. Meera Iyer (Pediatrics)
    '5': [
      {
        dateLabel: 'SAT 12 SEP',
        slots: [
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:00 AM', type: 'normal', isAvailable: false, isBooked: true, patientName: 'Anuradha Jadhav', patientUhid: 'RFH2026003', patientMobile: '9765432109', reason: 'Pediatric Vaccine OPD' },
          { time: '11:30 AM', type: 'normal', isAvailable: true },
          { time: '03:00 PM', type: 'walkin', isAvailable: true },
          { time: '03:30 PM', type: 'normal', isAvailable: true }
        ]
      },
      {
        dateLabel: 'SUN 13 SEP',
        slots: [
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true }
        ]
      },
      {
        dateLabel: 'MON 14 SEP',
        slots: [
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '11:00 AM', type: 'normal', isAvailable: true }
        ]
      }
    ]
  };

  // Doctor Schedule Days Fallback
  doctorScheduleDays: { dateLabel: string; slots: TimeSlot[] }[] = [
    {
      dateLabel: 'SAT 12 SEP',
      slots: [
        { time: '09:00 AM', type: 'walkin', isAvailable: true },
        { time: '09:15 AM', type: 'normal', isAvailable: true },
        { time: '09:30 AM', type: 'normal', isAvailable: false, isBooked: true },
        { time: '10:00 AM', type: 'normal', isAvailable: true },
        { time: '10:30 AM', type: 'emergency', isAvailable: false, isBooked: true },
        { time: '11:00 AM', type: 'premium', isAvailable: true },
        { time: '11:30 AM', type: 'normal', isAvailable: true }
      ]
    },
    {
      dateLabel: 'SUN 13 SEP',
      slots: [
        { time: '10:00 AM', type: 'normal', isAvailable: true },
        { time: '10:30 AM', type: 'normal', isAvailable: true },
        { time: '11:00 AM', type: 'normal', isAvailable: true }
      ]
    },
    {
      dateLabel: 'MON 14 SEP',
      slots: [
        { time: '09:00 AM', type: 'normal', isAvailable: true },
        { time: '10:00 AM', type: 'normal', isAvailable: true }
      ]
    }
  ];

  // Service Appointment Schedule Days (Pathology, Radiology, Diagnostic Tests & Procedures)
  serviceScheduleDays: { dateLabel: string; slots: TimeSlot[] }[] = [
    {
      dateLabel: 'SAT 12 SEP',
      slots: [
        { time: '08:00 AM', type: 'normal', isAvailable: true },
        { time: '08:30 AM', type: 'normal', isAvailable: false, isBooked: true },
        { time: '09:00 AM', type: 'normal', isAvailable: true },
        { time: '10:00 AM', type: 'normal', isAvailable: true },
        { time: '11:00 AM', type: 'normal', isAvailable: true },
        { time: '11:30 AM', type: 'emergency', isAvailable: false, isBooked: true },
        { time: '01:00 PM', type: 'premium', isAvailable: true },
        { time: '02:30 PM', type: 'normal', isAvailable: true },
        { time: '04:00 PM', type: 'blocked', isAvailable: false }
      ]
    },
    {
      dateLabel: 'SUN 13 SEP',
      slots: [
        { time: '08:30 AM', type: 'normal', isAvailable: true },
        { time: '09:30 AM', type: 'normal', isAvailable: false, isBooked: true },
        { time: '10:30 AM', type: 'normal', isAvailable: true },
        { time: '11:30 AM', type: 'normal', isAvailable: true },
        { time: '02:00 PM', type: 'emergency', isAvailable: false, isBooked: true }
      ]
    },
    {
      dateLabel: 'MON 14 SEP',
      slots: [
        { time: '08:00 AM', type: 'normal', isAvailable: true },
        { time: '09:00 AM', type: 'normal', isAvailable: true },
        { time: '10:00 AM', type: 'normal', isAvailable: true },
        { time: '11:00 AM', type: 'normal', isAvailable: false, isBooked: true },
        { time: '02:00 PM', type: 'premium', isAvailable: true },
        { time: '03:30 PM', type: 'free', isAvailable: false, isBooked: true }
      ]
    }
  ];

  scheduleDays = computed(() => {
    const selDay = this.selectedDate();
    const month = this.currentMonth();
    const year = this.currentYear();
    const isService = this.appointmentType() === 'service';
    const docId = this.selectedPractitioner();
    const now = new Date();

    // Base date selected on calendar
    const baseDate = new Date(year, month, selDay);
    const resultDays: { dateLabel: string; slots: TimeSlot[] }[] = [];

    // Get existing schedule map for active practitioner or service
    const existingDays = isService
      ? this.serviceScheduleDays
      : (docId && docId !== 'all' && this.doctorSchedulesMap[docId] ? this.doctorSchedulesMap[docId] : (this.doctorSchedulesMap['1'] || this.doctorScheduleDays));

    for (let i = 0; i < 3; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const dayName = this.shortDayNames[d.getDay()];
      const monthName = this.shortMonthNames[d.getMonth()];
      const dayNum = d.getDate();
      const dateLabel = `${dayName} ${dayNum} ${monthName}`;

      // Check if existingDays already has schedule for this dateLabel
      let targetDay = existingDays.find(ed => ed.dateLabel === dateLabel);
      if (!targetDay) {
        // Create new dynamic schedule day for future date
        const newSlots: TimeSlot[] = [
          { time: '09:00 AM', type: 'walkin', isAvailable: true },
          { time: '09:30 AM', type: 'normal', isAvailable: true },
          { time: '10:00 AM', type: 'normal', isAvailable: true },
          { time: '10:30 AM', type: 'normal', isAvailable: true },
          { time: '11:00 AM', type: 'premium', isAvailable: true },
          { time: '11:30 AM', type: 'normal', isAvailable: true },
          { time: '02:00 PM', type: 'normal', isAvailable: true },
          { time: '02:30 PM', type: 'walkin', isAvailable: true },
          { time: '03:00 PM', type: 'normal', isAvailable: true },
          { time: '03:30 PM', type: 'free', isAvailable: true }
        ];

        targetDay = { dateLabel, slots: newSlots };
        existingDays.push(targetDay);
      }

      // Map slots to update availability based on whether slot time is in the past
      const updatedSlots = targetDay.slots.map(slot => {
        const slotDt = this.getSlotDateTime(d, slot.time);
        const isPast = slotDt < now;
        return {
          ...slot,
          isAvailable: !slot.isBooked && slot.type !== 'blocked' && !isPast
        };
      });

      resultDays.push({
        dateLabel,
        slots: updatedSlots
      });
    }

    return resultDays;
  });

  activePractitionerHeader = computed(() => {
    if (this.appointmentType() === 'service') {
      const dept = this.selectedServiceDepartment();
      return {
        name: dept === 'All Departments' ? 'Central Diagnostics & Services' : dept,
        speciality: 'Hospital Diagnostic Services',
        fee: this.consultationFee()
      };
    }

    const docId = this.selectedPractitioner();
    if (docId && docId !== 'all') {
      const doc = this.practitioners.find(p => p.id === docId);
      if (doc) {
        return {
          name: doc.name,
          speciality: doc.speciality,
          fee: doc.fee
        };
      }
    }

    const first = this.practitioners[0];
    return {
      name: first ? first.name : 'Dr. Susheel Bindroo',
      speciality: first ? first.speciality : 'Pulmonology',
      fee: first ? first.fee : 1500
    };
  });

  moduleTabs = computed(() => this.authService.allowedModules());

  // Registered Patients List for Dropdown
  patientsList = signal<any[]>([]);

  activeSelectedPatientInfo = computed(() => {
    const sel = this.selectedPatient();
    if (!sel) return null;

    const match = this.patientsList().find(p => 
      sel.toLowerCase().includes(p.uhid.toLowerCase()) || 
      sel.toLowerCase().includes(p.name.toLowerCase())
    );

    if (match) {
      return {
        name: match.name,
        uhid: match.uhid,
        mobile: match.mobile,
        ageGender: match.ageGender || 'N/A'
      };
    }

    const matchGroup = sel.match(/^(.*?)\s*\((.*?)\)$/);
    if (matchGroup) {
      return {
        name: matchGroup[1].trim(),
        uhid: matchGroup[2].trim(),
        mobile: this.mobileNo() || '9820198201',
        ageGender: 'Registered Patient'
      };
    }

    return {
      name: sel,
      uhid: 'RFH2026' + Math.floor(1000 + Math.random() * 9000),
      mobile: this.mobileNo() || '9820198201',
      ageGender: 'Registered Patient'
    };
  });

  getSlotPatientName(slot: TimeSlot): string {
    if (slot.patientName) return slot.patientName;
    if (this.activeSelectedPatientInfo()) return this.activeSelectedPatientInfo()!.name;
    if (this.patientName()) return this.patientName();
    return 'Registered Patient';
  }

  getSlotPatientUhid(slot: TimeSlot): string {
    if (slot.patientUhid) return slot.patientUhid;
    if (this.activeSelectedPatientInfo()) return this.activeSelectedPatientInfo()!.uhid;
    return 'RFH2026' + Math.floor(1000 + Math.random() * 9000);
  }

  getSlotPatientMobile(slot: TimeSlot): string {
    if (slot.patientMobile) return slot.patientMobile;
    if (this.activeSelectedPatientInfo()) return this.activeSelectedPatientInfo()!.mobile;
    if (this.patientMobile()) return this.patientMobile();
    return this.mobileNo() || '9820198201';
  }

  ngOnInit(): void {
    // Fetch registered patients from JSON Server API
    this.apiService.get<any[]>('patients').subscribe({
      next: (apiData) => {
        if (Array.isArray(apiData) && apiData.length > 0) {
          const loaded = apiData.map(p => ({
            uhid: p.uhid || 'RFH2026' + Math.floor(1000 + Math.random() * 9000),
            name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            mobile: p.mobile ? p.mobile.replace(/\+91\s?/, '') : '',
            ageGender: `${p.age || '32'} Y / ${p.gender || 'Male'}`
          }));
          this.patientsList.set(loaded);
        } else {
          this.patientsList.set([]);
        }
      },
      error: () => {
        this.patientsList.set([]);
      }
    });

    // Check for query parameters passed from Magic Search or Registration
    this.route.queryParams.subscribe(params => {
      if (params['mobile']) {
        this.mobileNo.set(params['mobile']);
      }
      if (params['name']) {
        const nameVal = params['name'];
        const uhidVal = params['uhid'] ? ` (${params['uhid']})` : '';
        const fullSel = nameVal.includes('(') ? nameVal : `${nameVal}${uhidVal}`;
        this.onSelectPatientChange(fullSel);
        this.toastService.info(`Loaded patient "${nameVal}" for appointment booking.`);
      }
    });

    // Fetch data from JSON Server
    this.apiService.get<Practitioner[]>('practitioners').subscribe(data => {
      if (Array.isArray(data) && data.length > 0) {
        this.practitioners = data;
      }
    });

    this.apiService.get<HospitalServiceItem[]>('services').subscribe(data => {
      if (Array.isArray(data) && data.length > 0) {
        this.servicesList = data;
      }
    });

    // Fetch existing booked appointments from JSON Server API
    this.apiService.get<any[]>('appointments').subscribe({
      next: (appointments) => {
        if (Array.isArray(appointments) && appointments.length > 0) {
          this.syncBookedAppointments(appointments);
        }
      }
    });
  }

  syncBookedAppointments(appointments: any[]): void {
    appointments.forEach(appt => {
      if (!appt.dateStr || !appt.time) return;

      const patientName = appt.patientName || 'Booked Patient';
      const patientUhid = appt.uhid || appt.patientUhid || 'RFH2026001';
      const patientMobile = appt.mobile || appt.patientMobile || '9820198201';
      const reason = appt.description || appt.reason || 'OPD Consultation';

      // Sync across all doctor schedules in doctorSchedulesMap
      Object.keys(this.doctorSchedulesMap).forEach(docId => {
        const docDays = this.doctorSchedulesMap[docId];
        docDays.forEach(day => {
          if (day.dateLabel === appt.dateStr) {
            const slot = day.slots.find(s => s.time === appt.time);
            if (slot) {
              const doc = this.practitioners.find(p => p.id === docId);
              if (doc && appt.practitioner && appt.practitioner.toLowerCase().includes(doc.name.toLowerCase())) {
                slot.isAvailable = false;
                slot.isBooked = true;
                slot.patientName = patientName;
                slot.patientUhid = patientUhid;
                slot.patientMobile = patientMobile;
                slot.reason = reason;
              }
            }
          }
        });
      });

      // Sync across service schedule days
      this.serviceScheduleDays.forEach(day => {
        if (day.dateLabel === appt.dateStr && appt.type === 'Service') {
          const slot = day.slots.find(s => s.time === appt.time);
          if (slot) {
            slot.isAvailable = false;
            slot.isBooked = true;
            slot.patientName = patientName;
            slot.patientUhid = patientUhid;
            slot.patientMobile = patientMobile;
            slot.reason = reason;
          }
        }
      });
    });
  }

  onSelectPatientChange(val: string): void {
    this.selectedPatient.set(val);
    if (!val) return;

    const match = this.patientsList().find(p => 
      val.toLowerCase().includes(p.uhid.toLowerCase()) || 
      val.toLowerCase().includes(p.name.toLowerCase())
    );

    if (match) {
      this.mobileNo.set(match.mobile);
      this.patientName.set(match.name);
      this.patientMobile.set(match.mobile);
      this.toastService.success(`Selected Patient Loaded: ${match.name} (UHID: ${match.uhid})`);
    } else {
      this.toastService.info(`Selected Patient: ${val}`);
    }
  }

  clearPatientSelection(): void {
    this.selectedPatient.set('');
    this.mobileNo.set('');
    this.patientName.set('');
    this.patientMobile.set('');
  }

  constructor() {}

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  setAppointmentType(type: 'doctor' | 'service'): void {
    this.appointmentType.set(type);
  }

  selectModuleTab(tabId: string): void {
    this.activeModuleTab.set(tabId);
    if (tabId === 'MyDesk') {
      this.router.navigate(['/dashboard']);
    } else if (tabId === 'MagicSearch') {
      this.router.navigate(['/magic-search']);
    } else if (tabId === 'Registration') {
      this.router.navigate(['/registration']);
    } else if (tabId === 'DoctorAppointment') {
      this.router.navigate(['/doctor-appointment']);
    } else if (tabId === 'VitalsRecording') {
      this.router.navigate(['/vitals-recording']);
    } else if (tabId === 'DoctorPatientList') {
      this.router.navigate(['/doctor-patient-list']);
    } else if (tabId === 'MedicalRecords') {
      this.router.navigate(['/medical-records']);
    }
  }

  showQuickRegisterModal = signal<boolean>(false);
  quickTitle = signal<string>('Mr.');
  quickFirstName = signal<string>('');
  quickLastName = signal<string>('');
  quickMobile = signal<string>('');
  quickGender = signal<string>('Male');
  quickAge = signal<string>('30');
  quickCity = signal<string>('Mumbai');
  quickPayor = signal<string>('Self');


  searchPatientByPhone(): void {
    const val = this.mobileNo().trim();
    if (!val) {
      this.toastService.warning('Please enter a mobile or UHID number to search.');
      return;
    }

    this.apiService.get<any[]>('patients').subscribe({
      next: (patients) => {
        if (Array.isArray(patients)) {
          const match = patients.find(p => 
            (p.mobile && p.mobile.includes(val)) || 
            (p.uhid && p.uhid.toLowerCase().includes(val.toLowerCase())) ||
            (p.name && p.name.toLowerCase().includes(val.toLowerCase()))
          );

          if (match) {
            const name = match.name || `${match.firstName || ''} ${match.lastName || ''}`.trim();
            this.selectedPatient.set(`${name} (${match.uhid})`);
            this.mobileNo.set(match.mobile ? match.mobile.replace(/\+91\s?/, '') : val);
            this.toastService.success(`Patient profile retrieved! ${name} (UHID: ${match.uhid})`);
            return;
          }
        }

        // Fallback default patient matches
        if (val.includes('9820198201') || val.toLowerCase().includes('jagdish')) {
          this.selectedPatient.set('Jagdish Ramji Thakkar (RFH2026001)');
          this.toastService.success('Patient profile retrieved! Jagdish Ramji Thakkar (UHID: RFH2026001)');
        } else if (val.includes('9819283746') || val.toLowerCase().includes('qureshi')) {
          this.selectedPatient.set('Mohd. Zubair Qureshi (RFH2026002)');
          this.toastService.success('Patient profile retrieved! Mohd. Zubair Qureshi (UHID: RFH2026002)');
        } else {
          this.quickMobile.set(val);
          this.toastService.warning(`No registered patient found for "${val}". Opening Quick Registration...`);
          this.showQuickRegisterModal.set(true);
        }
      }
    });
  }

  saveQuickRegistration(markArrival: boolean = false): void {
    if (!this.quickFirstName().trim() || !this.quickLastName().trim() || !this.quickMobile().trim()) {
      this.toastService.warning('Please enter First Name, Last Name, and Mobile Number.');
      return;
    }

    const generatedUhid = 'RFH2026' + Math.floor(1000 + Math.random() * 9000);
    const fullName = `${this.quickTitle()} ${this.quickFirstName()} ${this.quickLastName()}`.trim();

    const newPatient = {
      uhid: generatedUhid,
      name: fullName,
      firstName: this.quickFirstName(),
      lastName: this.quickLastName(),
      mobile: this.quickMobile(),
      gender: this.quickGender(),
      age: this.quickAge(),
      city: this.quickCity(),
      payorType: this.quickPayor(),
      registeredOn: new Date().toISOString()
    };

    this.apiService.post('patients', newPatient).subscribe({
      next: (res) => {
        console.log('[JSON-Server] Quick patient registered:', res);
      }
    });

    this.selectedPatient.set(`${fullName} (${generatedUhid})`);
    this.mobileNo.set(this.quickMobile());
    this.showQuickRegisterModal.set(false);

    if (markArrival) {
      const generatedVisitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
      const newAppointmentVisit = {
        dateStr: 'SAT 12 SEP',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patientName: fullName,
        uhid: generatedUhid,
        mobile: this.quickMobile(),
        practitioner: 'General OPD Clinic',
        fee: 1500,
        status: 'ARRIVED AT DESK',
        visitId: generatedVisitId,
        type: 'OP',
        description: `Active Desk Arrival Visit (${generatedVisitId})`,
        bookedOn: new Date().toISOString()
      };
      this.apiService.post('appointments', newAppointmentVisit).subscribe();
      this.queueService.addPatientToQueue({
        uhid: generatedUhid,
        tokenNo: 'T-' + Math.floor(100 + Math.random() * 900),
        name: fullName,
        ageGender: `${this.quickAge() || 'N/A'} Y / ${this.quickGender() || 'N/A'}`,
        mobile: this.quickMobile(),
        appointmentTime: newAppointmentVisit.time,
        doctorName: 'General OPD Clinic',
        department: 'General Medicine',
        status: 'Waiting',
        vitals: null,
        complaints: '',
        clinicalFindings: '',
        diagnosis: '',
        prescription: [],
        history: []
      });
      this.toastService.success(`Quick Registered & Desk Arrival Marked! Active Visit ID: ${generatedVisitId}`);
      this.router.navigate(['/op-billing'], {
        queryParams: {
          name: fullName,
          uhid: generatedUhid,
          visitId: generatedVisitId,
          mobile: this.quickMobile()
        }
      });
    } else {
      this.toastService.success(`Quick Patient Registered! Assigned UHID: ${generatedUhid}`);
    }
  }

  clearSelection(): void {
    this.mobileNo.set('');
    this.phoneType.set('Mobile');
    this.selectedPatient.set('');
    this.selectedSpeciality.set('All');
    this.selectedPractitioner.set('all');
    this.selectedServiceDepartment.set('All Departments');
    this.selectedServices.set([]);
    this.toastService.info('Appointment filters cleared.');
  }

  // Cancel / Release Slot Modal State
  showCancelSlotModal = signal<boolean>(false);
  cancelSlotData = signal<{ dateLabel: string; slot: TimeSlot; docName: string; patientName: string; uhid: string; mobile: string; fee: number } | null>(null);
  cancelSlotReason = signal<string>('Patient Request / Unwell');

  openSlotModal(dateLabel: string, slot: TimeSlot): void {
    const doc = this.practitioners.find(p => p.id === this.selectedPractitioner()) || this.practitioners[0];

    // If slot is booked, open Cancel & Release Slot modal!
    if (slot.isBooked) {
      const patientNameVal = this.getSlotPatientName(slot);
      const patientUhidVal = this.getSlotPatientUhid(slot);
      const patientMobileVal = this.getSlotPatientMobile(slot);

      this.cancelSlotData.set({
        dateLabel,
        slot,
        docName: doc.name,
        patientName: patientNameVal,
        uhid: patientUhidVal,
        mobile: patientMobileVal,
        fee: doc.fee
      });
      this.showCancelSlotModal.set(true);
      return;
    }

    if (this.isSlotInPast(dateLabel, slot.time)) {
      this.toastService.warning('Past time slots cannot be booked for appointments.');
      return;
    }

    if (slot.type === 'blocked') {
      this.toastService.warning('This slot is blocked by doctor and unavailable for booking.');
      return;
    }

    const isService = this.appointmentType() === 'service';
    const selectedSrvs = this.selectedServices();

    let practitionerName = doc.name;
    let feeAmount = doc.fee;
    let summary = '';

    if (isService) {
      practitionerName = this.selectedServiceDepartment() === 'All Departments' ? 'Central Diagnostics & Services' : this.selectedServiceDepartment();
      feeAmount = this.consultationFee();
      summary = selectedSrvs.length > 0
        ? selectedSrvs.map(s => s.name).join(', ')
        : 'General Diagnostics & OPD Service';
    }

    const selInfo = this.activeSelectedPatientInfo();
    if (selInfo) {
      this.patientName.set(selInfo.name);
      this.patientMobile.set(selInfo.mobile || this.mobileNo());
    } else if (this.selectedPatient()) {
      const matchGroup = this.selectedPatient().match(/^(.*?)\s*\((.*?)\)$/);
      this.patientName.set(matchGroup ? matchGroup[1].trim() : this.selectedPatient());
      if (this.mobileNo()) this.patientMobile.set(this.mobileNo());
    }

    this.selectedSlot.set({
      dateStr: dateLabel,
      time: slot.time,
      practitioner: practitionerName,
      fee: feeAmount,
      servicesSummary: summary
    });
    this.showBookingModal.set(true);
  }

  confirmCancelSlot(): void {
    const data = this.cancelSlotData();
    if (!data) return;

    const { dateLabel, slot, patientName, docName } = data;
    const activeDays = this.scheduleDays();
    for (const day of activeDays) {
      if (day.dateLabel === dateLabel) {
        const target = day.slots.find(s => s.time === slot.time);
        if (target) {
          target.isAvailable = true;
          target.isBooked = false;
          target.patientName = undefined;
          target.patientUhid = undefined;
          target.patientMobile = undefined;
          target.reason = undefined;
        }
      }
    }

    this.showCancelSlotModal.set(false);
    this.toastService.success(`Appointment for "${patientName}" on ${dateLabel} at ${slot.time} with ${docName} has been CANCELLED and slot is now FREE!`);
  }

  confirmBooking(markArrival: boolean = false): void {
    const slot = this.selectedSlot();
    if (!slot) return;

    const selInfo = this.activeSelectedPatientInfo();
    const finalPatientName = this.patientName().trim() || selInfo?.name || this.selectedPatient() || 'Walk-in Patient';
    const finalPatientUhid = selInfo?.uhid || ('RFH2026' + Math.floor(1000 + Math.random() * 9000));
    const finalPatientMobile = this.patientMobile().trim() || selInfo?.mobile || this.mobileNo() || '9820198201';

    const activeDays = this.scheduleDays();
    for (const day of activeDays) {
      if (day.dateLabel === slot.dateStr) {
        const target = day.slots.find(s => s.time === slot.time);
        if (target) {
          target.isAvailable = false;
          target.isBooked = true;
          target.patientName = finalPatientName;
          target.patientUhid = finalPatientUhid;
          target.patientMobile = finalPatientMobile;
          target.reason = slot.servicesSummary || 'OPD Consultation';
        }
      }
    }

    const visitId = markArrival ? ('OPV-2026-' + Math.floor(10000 + Math.random() * 90000)) : undefined;

    const newAppointment = {
      dateStr: slot.dateStr,
      time: slot.time,
      patientName: finalPatientName,
      uhid: finalPatientUhid,
      mobile: finalPatientMobile,
      practitioner: slot.practitioner,
      fee: slot.fee,
      status: markArrival ? 'ARRIVED AT DESK' : 'CONFIRMED',
      visitId: visitId,
      type: this.appointmentType() === 'doctor' ? 'OP' : 'Service',
      description: markArrival 
        ? `Active Desk Arrival Visit (${visitId}) - ${slot.practitioner}`
        : `${this.appointmentType() === 'doctor' ? 'Doctor Consultation' : 'Service Booking'} - ${slot.practitioner}`,
      bookedOn: new Date().toISOString()
    };

    // Save to JSON Server /appointments endpoint
    this.apiService.post('appointments', newAppointment).subscribe({
      next: (res) => {
        console.log('[JSON-Server] Appointment stored in API:', res);
      }
    });

    this.showBookingModal.set(false);
    this.clearPatientSelection();
    this.selectedSlot.set(null);

    if (markArrival) {
      this.queueService.addPatientToQueue({
        uhid: finalPatientUhid,
        tokenNo: 'T-' + Math.floor(100 + Math.random() * 900),
        name: finalPatientName,
        ageGender: selInfo?.ageGender || 'N/A',
        mobile: finalPatientMobile,
        appointmentTime: slot.time,
        doctorName: slot.practitioner,
        department: this.practitioners.find(p => p.name === slot.practitioner)?.speciality || 'General Medicine',
        status: 'Waiting',
        vitals: null,
        complaints: '',
        clinicalFindings: '',
        diagnosis: '',
        prescription: [],
        history: []
      });
      this.toastService.success(`Arrival Marked for ${newAppointment.patientName}! Active Visit ID: ${visitId}`);
      this.router.navigate(['/op-billing'], {
        queryParams: {
          name: newAppointment.patientName,
          uhid: finalPatientUhid,
          visitId: visitId,
          practitioner: slot.practitioner,
          fee: slot.fee
        }
      });
    } else {
      this.toastService.success(`Appointment confirmed for ${slot.dateStr} at ${slot.time}! Stored in Worklist.`);
    }
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Doctor Appointment Help Guide opening...');
  }
}
