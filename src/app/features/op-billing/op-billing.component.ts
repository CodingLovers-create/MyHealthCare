import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { ToastService } from '../../core/services/toast.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';

export interface BillItem {
  id: string;
  name: string;
  department: string;
  qty: number;
  rate: number;
}

export interface TariffPlan {
  id: string;
  name: string;
  discountPercentage: number;
  description: string;
}

@Component({
  selector: 'app-op-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, SubheaderComponent],
  templateUrl: './op-billing.component.html'
})
export class OpBillingComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  public sidebarService = inject(SidebarService);
  public authService = inject(AuthService);

  activeModuleTab = signal<string>('OpBilling');

  // Patient & Visit Context
  patientName = signal<string>('');
  uhid = signal<string>('');
  visitId = signal<string>('');
  mobile = signal<string>('');
  genderAge = signal<string>('');
  practitioner = signal<string>('');
  speciality = signal<string>('');

  // Tariff & Discount Plans
  tariffPlans: TariffPlan[] = [
    { id: 't1', name: 'Standard Self Pay (0% Discount)', discountPercentage: 0, description: 'Standard hospital consultation tariff' },
    { id: 't2', name: 'Reliance Employee Corporate (20% Discount)', discountPercentage: 20, description: '20% corporate discount for Reliance Employees' },
    { id: 't3', name: 'Star Health TPA Insurance (15% Coverage)', discountPercentage: 15, description: '15% cashless TPA insurance coverage' },
    { id: 't4', name: 'Senior Citizen Welfare (10% Discount)', discountPercentage: 10, description: '10% discount for patients aged 60+' },
    { id: 't5', name: 'Hospital Trustee Waiver (100% Waiver)', discountPercentage: 100, description: '100% full waiver approved by Trustee' }
  ];

  selectedTariffId = signal<string>('t1');
  paymentMode = signal<string>('Cash');

  // Billing Line Items
  billItems = signal<BillItem[]>([]);

  // Modals & Printable Receipt
  showReceiptModal = signal<boolean>(false);
  receiptNumber = signal<string>('');
  receiptDate = signal<string>('');

  // Bill Cancellation & Refund Signals
  showCancelBillModal = signal<boolean>(false);
  cancelReason = signal<string>('Patient Request / Service Not Availed');
  cancelNotes = signal<string>('');
  isBillCancelled = signal<boolean>(false);

  // Past Bills History Signals
  showPastBillsModal = signal<boolean>(false);
  pastBillsList = signal<any[]>([]);

  selectedTariff = computed(() => {
    return this.tariffPlans.find(t => t.id === this.selectedTariffId()) || this.tariffPlans[0];
  });

  grossAmount = computed(() => {
    return this.billItems().reduce((sum, item) => sum + (item.qty * item.rate), 0);
  });

  discountAmount = computed(() => {
    const pct = this.selectedTariff().discountPercentage;
    return Math.round((this.grossAmount() * pct) / 100);
  });

  netAmountPayable = computed(() => {
    return Math.max(0, this.grossAmount() - this.discountAmount());
  });

  // Patient Search & Quick Select Signals
  searchUhidQuery = signal<string>('');
  matchingPatientsModal = signal<boolean>(false);
  matchingPatients = signal<any[]>([]);
  quickPatientList = signal<any[]>([
    { uhid: 'RFH2026001', name: 'Jagdish Ramji Thakkar', mobile: '9820198201', ageGender: '58 Y / Male', doctor: 'Dr. Susheel Bindroo', spec: 'Pulmonology' },
    { uhid: 'RFH2026008', name: 'Nita Jagdish Thakkar', mobile: '9820198201', ageGender: '54 Y / Female', doctor: 'Dr. Sneha Patil', spec: 'General Medicine' },
    { uhid: 'RFH2026002', name: 'Mohd. Zubair Qureshi', mobile: '9819283746', ageGender: '42 Y / Male', doctor: 'Dr. Alok Shah', spec: 'Cardiology' },
    { uhid: 'RFH23241854', name: 'Mr. PRATHAMESH SHASHANK KHOCHADE', mobile: '9892011223', ageGender: '30 Y / Male', doctor: 'Dr. Sneha Patil', spec: 'General Medicine' },
    { uhid: 'RFH2026003', name: 'Anuradha Jadhav', mobile: '9765432109', ageGender: '35 Y / Female', doctor: 'Pathology & Lab', spec: 'Diagnostics' },
    { uhid: 'RFH2026005', name: 'Pooja Dhanecha', mobile: '9123456789', ageGender: '31 Y / Female', doctor: 'Dr. Meera Iyer', spec: 'Pediatrics' }
  ]);

  // Service Selection Dropdown Signals & Catalog
  selectedServiceCategory = signal<string>('All Departments');
  selectedServiceId = signal<string>('');

  serviceCategories: string[] = [
    'All Departments',
    'Consultations & OPD',
    'Pathology & Laboratory',
    'Radiology & Imaging',
    'Cardiology Diagnostics',
    'Physiotherapy & Rehab',
    'Health Packages'
  ];

  allServicesList: BillItem[] = [
    { id: '101', name: 'OPD Doctor Consultation Fee', department: 'Consultations & OPD', qty: 1, rate: 1500 },
    { id: '102', name: 'OP Patient Registration & ID Card Charge', department: 'Consultations & OPD', qty: 1, rate: 100 },
    { id: '103', name: 'Complete Blood Count (CBC)', department: 'Pathology & Laboratory', qty: 1, rate: 350 },
    { id: '104', name: 'Fasting Blood Sugar (FBS) & HbA1c', department: 'Pathology & Laboratory', qty: 1, rate: 450 },
    { id: '105', name: 'Lipid Profile (Cholesterol)', department: 'Pathology & Laboratory', qty: 1, rate: 650 },
    { id: '106', name: 'Liver Function Test (LFT)', department: 'Pathology & Laboratory', qty: 1, rate: 750 },
    { id: '107', name: 'Kidney Function Test (KFT)', department: 'Pathology & Laboratory', qty: 1, rate: 700 },
    { id: '108', name: 'Thyroid Profile (T3, T4, TSH)', department: 'Pathology & Laboratory', qty: 1, rate: 550 },
    { id: '109', name: 'Chest X-Ray PA View', department: 'Radiology & Imaging', qty: 1, rate: 500 },
    { id: '110', name: 'USG Abdomen & Pelvis', department: 'Radiology & Imaging', qty: 1, rate: 1200 },
    { id: '111', name: 'CT Scan Brain Non-Contrast', department: 'Radiology & Imaging', qty: 1, rate: 2500 },
    { id: '112', name: 'MRI Brain 1.5T', department: 'Radiology & Imaging', qty: 1, rate: 4500 },
    { id: '113', name: 'ECG 12-Lead Diagnostic', department: 'Cardiology Diagnostics', qty: 1, rate: 300 },
    { id: '114', name: '2D Echocardiography', department: 'Cardiology Diagnostics', qty: 1, rate: 1800 },
    { id: '115', name: 'Treadmill Stress Test (TMT)', department: 'Cardiology Diagnostics', qty: 1, rate: 2200 },
    { id: '116', name: 'Post-Op Physical Therapy Session', department: 'Physiotherapy & Rehab', qty: 1, rate: 800 },
    { id: '117', name: 'Master Cardiac Health Checkup Package', department: 'Health Packages', qty: 1, rate: 3500 }
  ];

  filteredServicesList = computed(() => {
    const cat = this.selectedServiceCategory();
    if (!cat || cat === 'All Departments') {
      return this.allServicesList;
    }
    return this.allServicesList.filter(s => s.department === cat);
  });

  ngOnInit(): void {
    // Check API for registered patients to update quick select
    this.apiService.get<any[]>('patients').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const apiPatients = data.map(p => ({
            uhid: p.uhid || 'RFH2026' + Math.floor(1000 + Math.random() * 9000),
            name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            mobile: p.mobile ? p.mobile.replace(/\+91\s?/, '') : '9820198201',
            ageGender: `${p.age || '35'} Y / ${p.gender || 'Male'}`,
            doctor: 'General OPD Clinic',
            spec: 'OPD'
          }));
          const existingUhids = new Set(apiPatients.map(p => p.uhid));
          const combined = [
            ...apiPatients,
            ...this.quickPatientList().filter(qp => !existingUhids.has(qp.uhid))
          ];
          this.quickPatientList.set(combined);
        }
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['name']) this.patientName.set(params['name']);
      if (params['uhid']) this.uhid.set(params['uhid']);
      if (params['visitId']) this.visitId.set(params['visitId']);
      if (params['mobile']) this.mobile.set(params['mobile']);
      if (params['practitioner']) this.practitioner.set(params['practitioner']);
      
      const docName = params['practitioner'] || this.practitioner() || 'Dr. Susheel Bindroo';
      const feeNum = params['fee'] ? parseFloat(params['fee']) : 1500;

      if (params['name'] || params['visitId'] || params['fee']) {
        this.billItems.set([
          { id: '101', name: `OPD Consultation Fee (${docName})`, department: 'Consultations & OPD', qty: 1, rate: feeNum },
          { id: '102', name: 'OP Registration & Service Fee', department: 'Front Desk', qty: 1, rate: 100 }
        ]);
      }
    });
  }

  searchPatientByUhid(): void {
    const query = this.searchUhidQuery().trim().toLowerCase();
    if (!query) {
      this.toastService.warning('Please enter UHID, Mobile Number, Receipt No, or Patient Name to search.');
      return;
    }

    this.apiService.get<any[]>('appointments').subscribe({
      next: (appts) => {
        const pastBillMatches = Array.isArray(appts) ? appts.filter(a => 
          (a.receiptNumber && a.receiptNumber.toLowerCase().includes(query)) ||
          (a.visitId && a.visitId.toLowerCase().includes(query)) ||
          (a.uhid && a.uhid.toLowerCase().includes(query)) ||
          (a.mobile && a.mobile.includes(query)) ||
          (a.patientName && a.patientName.toLowerCase().includes(query))
        ) : [];

        if (pastBillMatches.length > 0 && query.startsWith('opr')) {
          this.loadPastBillIntoScreen(pastBillMatches[0]);
          return;
        }

        const matches = this.quickPatientList().filter(p => 
          p.uhid.toLowerCase().includes(query) ||
          p.mobile.includes(query) ||
          p.name.toLowerCase().includes(query)
        );

        if (matches.length > 1) {
          this.matchingPatients.set(matches);
          this.matchingPatientsModal.set(true);
          this.toastService.info(`Found ${matches.length} patients matching your query. Please select one.`);
        } else if (matches.length === 1) {
          this.selectPatientForBilling(matches[0]);
        } else if (pastBillMatches.length > 0) {
          this.loadPastBillIntoScreen(pastBillMatches[0]);
        } else {
          const generatedUhid = query.toUpperCase().startsWith('RFH') ? query.toUpperCase() : 'RFH2026' + Math.floor(1000 + Math.random() * 9000);
          const generatedVisitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
          this.patientName.set(query.toUpperCase().startsWith('RFH') ? 'Registered Patient' : query);
          this.uhid.set(generatedUhid);
          this.visitId.set(generatedVisitId);
          this.toastService.success(`Active Visit & UHID Context Loaded: ${this.patientName()} (${generatedUhid})`);
        }
      },
      error: () => {
        const matches = this.quickPatientList().filter(p => 
          p.uhid.toLowerCase().includes(query) ||
          p.mobile.includes(query) ||
          p.name.toLowerCase().includes(query)
        );
        if (matches.length > 0) {
          this.selectPatientForBilling(matches[0]);
        }
      }
    });
  }

  openPastBillsModal(): void {
    this.apiService.get<any[]>('appointments').subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          const billed = data.filter(a => a.isBilled || a.status === 'BILLED' || a.status === 'CANCELLED' || a.receiptNumber);
          this.pastBillsList.set(billed.reverse());
        } else {
          this.pastBillsList.set([]);
        }
        this.showPastBillsModal.set(true);
      },
      error: () => {
        this.pastBillsList.set([]);
        this.showPastBillsModal.set(true);
      }
    });
  }

  loadPastBillIntoScreen(bill: any, openCancelModalImmediate: boolean = false): void {
    this.patientName.set(bill.patientName || 'Patient');
    this.uhid.set(bill.uhid || 'RFH2026' + Math.floor(1000 + Math.random() * 9000));
    this.mobile.set(bill.mobile ? bill.mobile.replace(/\+91\s?/, '') : '');
    this.visitId.set(bill.visitId || 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000));
    this.practitioner.set(bill.practitioner || 'General OPD Clinic');
    this.receiptNumber.set(bill.receiptNumber || 'OPR-2026-' + Math.floor(10000 + Math.random() * 90000));
    this.receiptDate.set(bill.bookedOn ? new Date(bill.bookedOn).toLocaleString() : new Date().toLocaleString());
    this.isBillCancelled.set(bill.status === 'CANCELLED');

    const feeAmount = bill.fee || 1500;
    this.billItems.set([
      { id: '1', name: `OP Consultation & Service (${bill.practitioner || 'OPD Clinic'})`, department: 'OPD Clinic', qty: 1, rate: feeAmount }
    ]);

    this.showPastBillsModal.set(false);
    this.toastService.success(`Loaded Previous Bill Receipt (${this.receiptNumber()}) for ${this.patientName()}`);

    if (openCancelModalImmediate) {
      this.openCancelBillModal();
    }
  }

  selectPatientForBilling(patient: any): void {
    this.patientName.set(patient.name);
    this.uhid.set(patient.uhid);
    this.mobile.set(patient.mobile);
    this.genderAge.set(patient.ageGender || '30 Y / Male');
    this.visitId.set('OPV-2026-' + Math.floor(10000 + Math.random() * 90000));
    if (patient.doctor) this.practitioner.set(patient.doctor);
    if (patient.spec) this.speciality.set(patient.spec);
    this.matchingPatientsModal.set(false);

    // Preselect OPD Consult service item when patient is selected for billing
    const docName = patient.doctor || 'Dr. Susheel Bindroo';
    this.billItems.set([
      { id: '101', name: `OPD Consultation Fee (${docName})`, department: 'Consultations & OPD', qty: 1, rate: 1500 },
      { id: '102', name: 'OP Registration & Service Fee', department: 'Front Desk', qty: 1, rate: 100 }
    ]);

    this.toastService.success(`Patient Selected: ${patient.name} (${patient.uhid}) - Preselected OPD Consult`);
  }

  selectPatientFromQuickList(uhidVal: string): void {
    if (!uhidVal) return;
    this.searchUhidQuery.set(uhidVal);
    this.searchPatientByUhid();
  }

  addSelectedServiceFromDropdown(): void {
    const serviceId = this.selectedServiceId();
    if (!serviceId) {
      this.toastService.warning('Please select a service from the dropdown.');
      return;
    }
    const item = this.allServicesList.find(s => s.id === serviceId);
    if (item) {
      this.addItem(item.name, item.rate, item.department);
      this.selectedServiceId.set('');
    }
  }

  onTariffChange(newTariffId: string): void {
    this.selectedTariffId.set(newTariffId);
    const plan = this.tariffPlans.find(t => t.id === newTariffId);
    if (plan) {
      this.toastService.info(`Applied Tariff Plan: "${plan.name}" (${plan.discountPercentage}% Discount)`);
    }
  }

  addItem(name: string, rate: number, department: string = 'Diagnostics'): void {
    const newItem: BillItem = {
      id: Date.now().toString(),
      name,
      department,
      qty: 1,
      rate
    };
    this.billItems.update(items => [...items, newItem]);
    this.toastService.success(`Added "${name}" (INR ${rate}) to bill.`);
  }

  removeItem(id: string): void {
    this.billItems.update(items => items.filter(i => i.id !== id));
    this.toastService.info('Line item removed.');
  }

  processPayment(): void {
    const recNo = 'OPR-2026-' + Math.floor(10000 + Math.random() * 90000);
    this.receiptNumber.set(recNo);
    const now = new Date();
    this.receiptDate.set(now.toLocaleString());
    this.isBillCancelled.set(false);

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${days[now.getDay()]} ${now.getDate().toString().padStart(2, '0')} ${months[now.getMonth()]}`;
    let hours = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;

    const billedRecord = {
      uhid: this.uhid(),
      patientName: this.patientName(),
      mobile: this.mobile(),
      visitId: this.visitId(),
      practitioner: this.practitioner(),
      fee: this.netAmountPayable(),
      status: 'BILLED',
      isBilled: true,
      receiptNumber: recNo,
      dateStr: dateStr,
      time: timeStr,
      type: 'OP',
      description: `OP Billing Completed (${recNo})`,
      bookedOn: now.toISOString()
    };
    this.apiService.post('appointments', billedRecord).subscribe();

    this.showReceiptModal.set(true);
    this.toastService.success(`OP Consultation Payment Processed Successfully! Receipt No: ${recNo}`);
  }

  openCancelBillModal(): void {
    if (!this.receiptNumber() && !this.uhid()) {
      this.toastService.warning('Please select a billed patient or generate a receipt first to cancel.');
      return;
    }
    this.showCancelBillModal.set(true);
  }

  resetBillingState(): void {
    this.patientName.set('');
    this.uhid.set('');
    this.visitId.set('');
    this.mobile.set('');
    this.genderAge.set('');
    this.practitioner.set('');
    this.speciality.set('');
    this.receiptNumber.set('');
    this.receiptDate.set('');
    this.searchUhidQuery.set('');
    this.billItems.set([]);
    this.isBillCancelled.set(false);
    this.selectedServiceCategory.set('All Departments');
    this.selectedServiceId.set('');
  }

  confirmCancelBill(): void {
    if (!this.cancelReason()) {
      this.toastService.warning('Please select a reason for bill cancellation.');
      return;
    }

    const recNo = this.receiptNumber() || 'OPR-2026-REFUND';
    const pName = this.patientName() || 'Patient';
    const refundFee = this.netAmountPayable();

    if (this.visitId()) {
      this.apiService.get<any[]>('appointments').subscribe({
        next: (appts) => {
          if (Array.isArray(appts)) {
            const match = appts.find(a => a.visitId === this.visitId() || a.uhid === this.uhid());
            if (match && match.id) {
              this.apiService.put(`appointments/${match.id}`, {
                ...match,
                status: 'CANCELLED',
                statusCode: 'CANCELLED',
                isBilled: false,
                cancellationReason: this.cancelReason(),
                cancelledAt: new Date().toISOString()
              }).subscribe();
            }
          }
        }
      });
    }

    this.showCancelBillModal.set(false);
    this.showReceiptModal.set(false);
    this.resetBillingState();
    this.toastService.success(`Bill Receipt (${recNo}) for ${pName} Voided & Refund of INR ${refundFee} Processed! Billing screen cleared.`);
  }

  closeReceipt(): void {
    this.showReceiptModal.set(false);
  }

  printReceipt(): void {
    window.print();
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }
}
