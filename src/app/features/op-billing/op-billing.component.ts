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
  patientName = signal<string>('Jagdish Ramji Thakkar');
  uhid = signal<string>('RFH2026001');
  visitId = signal<string>('OPV-2026-98102');
  mobile = signal<string>('9820198201');
  genderAge = signal<string>('58 Y / Male');
  practitioner = signal<string>('Dr. Susheel Bindroo');
  speciality = signal<string>('Pulmonology');

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
  billItems = signal<BillItem[]>([
    { id: '1', name: 'OPD Doctor Consultation Fee', department: 'Pulmonology OPD', qty: 1, rate: 1500 },
    { id: '2', name: 'OP Patient Registration & ID Card Charge', department: 'Registration Desk', qty: 1, rate: 100 }
  ]);

  // Modals & Printable Receipt
  showReceiptModal = signal<boolean>(false);
  receiptNumber = signal<string>('');
  receiptDate = signal<string>('');

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
  quickPatientList = signal<any[]>([
    { uhid: 'RFH2026001', name: 'Jagdish Ramji Thakkar', mobile: '9820198201', ageGender: '58 Y / Male', doctor: 'Dr. Susheel Bindroo', spec: 'Pulmonology' },
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
      if (params['fee']) {
        const feeNum = parseFloat(params['fee']);
        if (!isNaN(feeNum) && feeNum > 0) {
          this.billItems.set([
            { id: '1', name: `OP Consultation Fee (${this.practitioner()})`, department: 'OPD Clinic', qty: 1, rate: feeNum },
            { id: '2', name: 'OP Registration & Service Fee', department: 'Front Desk', qty: 1, rate: 100 }
          ]);
        }
      }
    });
  }

  searchPatientByUhid(): void {
    const query = this.searchUhidQuery().trim().toLowerCase();
    if (!query) {
      this.toastService.warning('Please enter UHID, Mobile Number, or Patient Name to search.');
      return;
    }

    const match = this.quickPatientList().find(p => 
      p.uhid.toLowerCase().includes(query) ||
      p.mobile.includes(query) ||
      p.name.toLowerCase().includes(query)
    );

    if (match) {
      this.patientName.set(match.name);
      this.uhid.set(match.uhid);
      this.mobile.set(match.mobile);
      this.genderAge.set(match.ageGender);
      this.visitId.set('OPV-2026-' + Math.floor(10000 + Math.random() * 90000));
      if (match.doctor) this.practitioner.set(match.doctor);
      if (match.spec) this.speciality.set(match.spec);
      this.toastService.success(`Patient Profile Retrieved: ${match.name} (UHID: ${match.uhid})`);
    } else {
      const generatedUhid = query.toUpperCase().startsWith('RFH') ? query.toUpperCase() : 'RFH2026' + Math.floor(1000 + Math.random() * 9000);
      const generatedVisitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
      this.patientName.set(query.toUpperCase().startsWith('RFH') ? 'Registered Patient' : query);
      this.uhid.set(generatedUhid);
      this.visitId.set(generatedVisitId);
      this.toastService.success(`Active Visit & UHID Context Loaded: ${this.patientName()} (${generatedUhid})`);
    }
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
    this.receiptDate.set(new Date().toLocaleString());
    this.showReceiptModal.set(true);
    this.toastService.success(`OP Consultation Payment Processed Successfully! Receipt No: ${recNo}`);
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
