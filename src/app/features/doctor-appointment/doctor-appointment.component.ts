import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

export interface TimeSlot {
  time: string;
  type: 'walkin' | 'normal' | 'emergency' | 'blocked' | 'priority' | 'premium' | 'free' | 'phc';
  isBooked?: boolean;
  isAvailable?: boolean;
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
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctor-appointment.component.html'
})
export class DoctorAppointmentComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
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
  selectedService = signal<string>('');
  payorType = signal<string>('Self');

  // Service Appointment Signals & State
  selectedServiceDepartment = signal<string>('All Departments');
  selectedServices = signal<HospitalServiceItem[]>([]);

  // Calendar State
  currentYear = signal<number>(2026);
  currentMonth = signal<number>(8); // September (0-indexed: 8)
  selectedDate = signal<number>(12);

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Slot Booking Modal State
  selectedSlot = signal<{ dateStr: string; time: string; practitioner: string; fee: number; servicesSummary?: string } | null>(null);
  showBookingModal = signal<boolean>(false);
  patientName = signal<string>('');
  patientMobile = signal<string>('');

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

  // Doctor Schedule Days
  doctorScheduleDays: { dateLabel: string; slots: TimeSlot[] }[] = [
    {
      dateLabel: 'SAT 12 SEP',
      slots: [
        { time: '09:00 AM', type: 'walkin', isAvailable: true },
        { time: '09:15 AM', type: 'normal', isAvailable: true },
        { time: '09:30 AM', type: 'normal', isAvailable: false, isBooked: true },
        { time: '10:00 AM', type: 'priority', isAvailable: true },
        { time: '10:30 AM', type: 'emergency', isAvailable: false, isBooked: true },
        { time: '11:00 AM', type: 'premium', isAvailable: true },
        { time: '11:30 AM', type: 'normal', isAvailable: true },
        { time: '02:00 PM', type: 'walkin', isAvailable: true },
        { time: '02:30 PM', type: 'free', isAvailable: true },
        { time: '03:00 PM', type: 'phc', isAvailable: false, isBooked: true },
        { time: '04:00 PM', type: 'blocked', isAvailable: false }
      ]
    },
    {
      dateLabel: 'SUN 13 SEP',
      slots: [
        { time: '10:00 AM', type: 'normal', isAvailable: true },
        { time: '10:30 AM', type: 'priority', isAvailable: false, isBooked: true },
        { time: '11:00 AM', type: 'normal', isAvailable: true },
        { time: '11:30 AM', type: 'premium', isAvailable: true },
        { time: '02:00 PM', type: 'emergency', isAvailable: false, isBooked: true },
        { time: '03:00 PM', type: 'walkin', isAvailable: true }
      ]
    },
    {
      dateLabel: 'MON 14 SEP',
      slots: [
        { time: '09:00 AM', type: 'normal', isAvailable: true },
        { time: '09:30 AM', type: 'normal', isAvailable: true },
        { time: '10:00 AM', type: 'priority', isAvailable: true },
        { time: '10:30 AM', type: 'walkin', isAvailable: false, isBooked: true },
        { time: '11:00 AM', type: 'normal', isAvailable: true },
        { time: '11:30 AM', type: 'normal', isAvailable: true },
        { time: '02:00 PM', type: 'premium', isAvailable: true },
        { time: '02:30 PM', type: 'phc', isAvailable: true },
        { time: '03:30 PM', type: 'free', isAvailable: false, isBooked: true }
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
        { time: '10:00 AM', type: 'priority', isAvailable: true },
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
        { time: '10:30 AM', type: 'priority', isAvailable: true },
        { time: '11:30 AM', type: 'normal', isAvailable: true },
        { time: '02:00 PM', type: 'emergency', isAvailable: false, isBooked: true }
      ]
    },
    {
      dateLabel: 'MON 14 SEP',
      slots: [
        { time: '08:00 AM', type: 'normal', isAvailable: true },
        { time: '09:00 AM', type: 'normal', isAvailable: true },
        { time: '10:00 AM', type: 'priority', isAvailable: true },
        { time: '11:00 AM', type: 'normal', isAvailable: false, isBooked: true },
        { time: '02:00 PM', type: 'premium', isAvailable: true },
        { time: '03:30 PM', type: 'free', isAvailable: false, isBooked: true }
      ]
    }
  ];

  scheduleDays = computed(() => {
    return this.appointmentType() === 'doctor' ? this.doctorScheduleDays : this.serviceScheduleDays;
  });

  moduleTabs = computed(() => this.authService.allowedModules());

  ngOnInit(): void {
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
    }
  }

  selectDate(day: number): void {
    this.selectedDate.set(day);
    this.toastService.info(`Selected date: ${day} ${this.monthNames[this.currentMonth()]} ${this.currentYear()}`);
  }

  searchPatientByPhone(): void {
    const val = this.mobileNo().trim();
    const type = this.phoneType();
    if (!val) {
      this.toastService.warning(`Please enter a ${type} number to search patient records.`);
      return;
    }
    this.toastService.info(`Searching patient database by ${type}: +91 ${val}...`);
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

  openSlotModal(dateLabel: string, slot: TimeSlot): void {
    if (!slot.isAvailable || slot.type === 'blocked' || slot.isBooked) {
      this.toastService.warning('This slot is unavailable or already booked.');
      return;
    }

    const doc = this.practitioners.find(p => p.id === this.selectedPractitioner()) || this.practitioners[0];
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

    this.selectedSlot.set({
      dateStr: dateLabel,
      time: slot.time,
      practitioner: practitionerName,
      fee: feeAmount,
      servicesSummary: summary
    });
    this.showBookingModal.set(true);
  }

  confirmBooking(): void {
    const slot = this.selectedSlot();
    if (!slot) return;

    // Find slot in activeScheduleDays and mark as booked & unavailable
    const activeDays = this.appointmentType() === 'doctor' ? this.doctorScheduleDays : this.serviceScheduleDays;
    for (const day of activeDays) {
      if (day.dateLabel === slot.dateStr) {
        const target = day.slots.find(s => s.time === slot.time);
        if (target) {
          target.isAvailable = false;
          target.isBooked = true;
        }
      }
    }

    this.showBookingModal.set(false);
    this.toastService.success(`Appointment confirmed for ${slot.dateStr} at ${slot.time}! Slot marked as Booked.`);
  }

  createPrioritySlot(): void {
    this.toastService.info('Priority slot creation request submitted to Hospital Admin.');
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Doctor Appointment Help Guide opening...');
  }
}
