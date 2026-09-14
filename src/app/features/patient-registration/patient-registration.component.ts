import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../core/services/sidebar.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, SubheaderComponent],
  templateUrl: './patient-registration.component.html'
})
export class PatientRegistrationComponent implements OnInit {
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);
  
  constructor(
    private router: Router, 
    private toastService: ToastService,
    public sidebarService: SidebarService,
    public authService: AuthService
  ) {
    if (this.authService.isPatientExecutive()) {
      this.toastService.warning('Patient Executives are restricted to the Booking Appointments screen.');
      this.router.navigate(['/doctor-appointment']);
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  // Navigation tab state
  activeModuleTab = signal<string>('Registration');
  
  // Reactive Form Definition
  patientForm: FormGroup = this.fb.group({
    registrationType: ['General', Validators.required],
    mobileCountryCode: ['+91'],
    mobileNo: ['', [Validators.required]],
    whatsappCountryCode: ['+91'],
    whatsappNo: [''],
    uhid: [''],
    aadharId: [''],
    abhaId: [''],
    title: ['Mr.', Validators.required],
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    dob: [''],
    isAgeChecked: [false],
    age: [''],
    ageUnit: ['Year'],
    gender: ['Male', Validators.required],
    maritalStatus: ['Single'],
    fatherSpouseType: ['Father'],
    fatherSpouseName: [''],
    isEmailNA: [false],
    email: [''],
    nationality: ['Indian'],
    panCardNo: [''],
    emergencyContactName: [''],
    relation: ['Spouse'],
    emergencyCountryCode: ['+91'],
    emergencyNo: [''],
    registrationSource: ['Walk-in'],
    employmentStatus: [''],
    grade: [''],
    department: [''],
    plant: [''],
    employeeCadre: [''],
    // Present Address
    country: ['India'],
    pinCode: [''],
    houseNo: [''],
    streetLocality: [''],
    state: ['Maharashtra'],
    city: ['Mumbai'],
    area: [''],
    // Permanent Address
    permCountry: ['India'],
    permPinCode: [''],
    permHouseNo: [''],
    permStreetLocality: [''],
    permState: ['Maharashtra'],
    permCity: ['Mumbai'],
    permArea: [''],
    isSameAddress: [false],
    // Other details
    occupation: [''],
    bloodGroup: ['O+'],
    referredBy: [''],
    // Family details
    kinName: [''],
    kinRelation: ['Spouse'],
    kinContact: [''],
    // Payor Details
    payorType: ['self'],
    corporateName: [''],
    employeeId: [''],
    insuranceCompany: [''],
    tpaCardNo: [''],
    // Consents
    consentResearch: [true],
    consentPromotional: [true]
  });

  // Signal representation of reactive form values
  formValues = toSignal(this.patientForm.valueChanges, { initialValue: this.patientForm.value });

  // Existing Patient Matching Popup Signals
  patientsList = signal<any[]>([]);
  matchingPatientsList = signal<any[]>([]);
  showMatchingPatientsDropdown = signal<boolean>(false);

  isExistingPatient = computed(() => {
    const currentUhid = (this.formValues().uhid || '').trim();
    if (!currentUhid) return false;
    return this.patientsList().some(p => p.uhid && p.uhid.toLowerCase() === currentUhid.toLowerCase());
  });

  ngOnInit(): void {
    // API Data Load
    this.apiService.get<any[]>('patients').subscribe({
      next: (apiData) => {
        if (Array.isArray(apiData) && apiData.length > 0) {
          const loaded = apiData.map(p => ({
            uhid: p.uhid || '',
            name: p.name || `${p.title || ''} ${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim(),
            title: p.title || '',
            firstName: p.firstName || (p.name ? p.name.split(' ')[0] : ''),
            middleName: p.middleName || '',
            lastName: p.lastName || (p.name ? p.name.split(' ').slice(-1)[0] : ''),
            mobile: p.mobile ? p.mobile.replace(/\+91\s?/, '') : '',
            age: p.age !== undefined && p.age !== null ? String(p.age) : '',
            gender: p.gender || '',
            dob: p.dob || '',
            email: p.email || '',
            city: p.address?.city || p.city || '',
            state: p.address?.state || p.state || '',
            houseNo: p.address?.houseNo || p.houseNo || '',
            streetLocality: p.address?.street || p.streetLocality || '',
            pinCode: p.address?.pinCode || p.pinCode || ''
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
  }

  onMobileInput(): void {
    const val = (this.patientForm.value.mobileNo || '').trim().replace(/\+91\s?/, '');
    if (val.length >= 3) {
      const matches = this.patientsList().filter(p => 
        (p.mobile && p.mobile.includes(val)) || 
        (p.name && p.name.toLowerCase().includes(val.toLowerCase()))
      );
      this.matchingPatientsList.set(matches);
      this.showMatchingPatientsDropdown.set(matches.length > 0);
    } else {
      this.matchingPatientsList.set([]);
      this.showMatchingPatientsDropdown.set(false);
    }
  }

  selectExistingPatient(p: any): void {
    this.patientForm.patchValue({
      title: p.title || 'Mr.',
      firstName: p.firstName || '',
      middleName: p.middleName || '',
      lastName: p.lastName || '',
      mobileNo: p.mobile || '',
      uhid: p.uhid || '',
      dob: p.dob || '',
      age: p.age || '',
      gender: p.gender || 'Male',
      email: p.email || '',
      city: p.city || 'Mumbai',
      state: p.state || 'Maharashtra',
      houseNo: p.houseNo || '',
      streetLocality: p.streetLocality || '',
      pinCode: p.pinCode || ''
    });

    this.showMatchingPatientsDropdown.set(false);
    this.toastService.success(`Loaded profile for "${p.name || p.firstName}" (UHID: ${p.uhid})`);
  }

  // Photo & Document Upload State
  capturedPhoto = signal<string | null>(null);

  // Address Section Tab State
  activeAddressTab = signal<'present' | 'permanent' | 'other' | 'family'>('present');

  // Success Feedback Toast/Modal
  showSuccessModal = signal<boolean>(false);
  registeredUhid = signal<string>('');

  // Cascading state/city mappings
  citiesByState: Record<string, string[]> = {
    'Maharashtra': ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai', 'Nagpur', 'Nashik'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
    'Uttar Pradesh': ['Noida', 'Lucknow', 'Kanpur', 'Agra', 'Varanasi']
  };

  availableCities = computed(() => {
    const currentState = this.formValues().state || 'Maharashtra';
    return this.citiesByState[currentState] || ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai'];
  });

  availablePermCities = computed(() => {
    const currentPermState = this.formValues().permState || 'Maharashtra';
    return this.citiesByState[currentPermState] || ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai'];
  });

  moduleTabs = computed(() => this.authService.allowedModules());

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

  selectAddressTab(tab: 'present' | 'permanent' | 'other' | 'family'): void {
    this.activeAddressTab.set(tab);
  }

  onStateChange(): void {
    const newState = this.patientForm.value.state;
    const cities = this.citiesByState[newState];
    if (cities && cities.length > 0) {
      this.patientForm.patchValue({ city: cities[0] });
    }
  }

  onPermStateChange(): void {
    const newState = this.patientForm.value.permState;
    const cities = this.citiesByState[newState];
    if (cities && cities.length > 0) {
      this.patientForm.patchValue({ permCity: cities[0] });
    }
  }

  onDobChange(): void {
    const dobValue = this.patientForm.value.dob;
    if (dobValue) {
      const parts = dobValue.split(/[-/]/);
      let birthDate: Date | null = null;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
      if (birthDate && !isNaN(birthDate.getTime())) {
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          years--;
        }
        if (years >= 1) {
          this.patientForm.patchValue({ age: years.toString(), ageUnit: 'Year', isAgeChecked: true });
        } else {
          let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
          if (months >= 1) {
            this.patientForm.patchValue({ age: months.toString(), ageUnit: 'Month', isAgeChecked: true });
          } else {
            const diffTime = Math.abs(today.getTime() - birthDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.patientForm.patchValue({ age: diffDays.toString(), ageUnit: 'Day', isAgeChecked: true });
          }
        }
      }
    }
  }

  toggleEmailNA(): void {
    if (this.patientForm.value.isEmailNA) {
      this.patientForm.patchValue({ email: '' });
    }
  }

  toggleSameAddress(): void {
    if (this.patientForm.value.isSameAddress) {
      const val = this.patientForm.value;
      this.patientForm.patchValue({
        permCountry: val.country,
        permPinCode: val.pinCode,
        permHouseNo: val.houseNo,
        permStreetLocality: val.streetLocality,
        permState: val.state,
        permCity: val.city,
        permArea: val.area
      });
    }
  }

  setPayorType(type: 'self' | 'corporate' | 'insurance'): void {
    this.patientForm.patchValue({ payorType: type });
  }

  sendAbhaOtp(): void {
    this.toastService.success('OTP sent successfully to registered mobile for ABHA verification.');
  }

  clickPhoto(): void {
    this.capturedPhoto.set('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
    this.toastService.info('Patient photo captured via webcam.');
  }

  browsePhoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.capturedPhoto.set(event.target.result);
          this.toastService.success('Patient photo updated successfully.');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  scanDoc(): void {
    this.toastService.info('Document scanner initialized. Scanning patient identity document...');
  }

  onClear(): void {
    this.patientForm.reset({
      registrationType: 'General',
      mobileCountryCode: '+91',
      mobileNo: '',
      whatsappCountryCode: '+91',
      whatsappNo: '',
      uhid: '',
      aadharId: '',
      abhaId: '',
      title: 'Mr.',
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      isAgeChecked: false,
      age: '',
      ageUnit: 'Year',
      gender: 'Male',
      maritalStatus: 'Single',
      fatherSpouseType: 'Father',
      fatherSpouseName: '',
      isEmailNA: false,
      email: '',
      nationality: 'Indian',
      panCardNo: '',
      emergencyContactName: '',
      relation: 'Spouse',
      emergencyCountryCode: '+91',
      emergencyNo: '',
      registrationSource: 'Walk-in',
      employmentStatus: '',
      grade: '',
      department: '',
      plant: '',
      employeeCadre: '',
      country: 'India',
      pinCode: '',
      houseNo: '',
      streetLocality: '',
      state: 'Maharashtra',
      city: 'Mumbai',
      area: '',
      permCountry: 'India',
      permPinCode: '',
      permHouseNo: '',
      permStreetLocality: '',
      permState: 'Maharashtra',
      permCity: 'Mumbai',
      permArea: '',
      isSameAddress: false,
      occupation: '',
      bloodGroup: 'O+',
      referredBy: '',
      kinName: '',
      kinRelation: 'Spouse',
      kinContact: '',
      payorType: 'self',
      corporateName: '',
      employeeId: '',
      insuranceCompany: '',
      tpaCardNo: '',
      consentResearch: true,
      consentPromotional: true
    });
    this.capturedPhoto.set(null);
    this.toastService.info('Registration form cleared.');
  }

  onPrint(): void {
    window.print();
  }

  activeVisitId = signal<string>('');
  isArrivalMarked = signal<boolean>(false);

  onRegister(markArrival: boolean = false): void {
    const val = this.patientForm.value;

    if (!val.firstName?.trim()) {
      this.toastService.warning('Please enter First Name.');
      return;
    }
    if (!val.lastName?.trim()) {
      this.toastService.warning('Please enter Last Name.');
      return;
    }
    if (!val.mobileNo?.trim()) {
      this.toastService.warning('Please enter Mobile No.');
      return;
    }

    const currentUhid = (val.uhid || '').trim();
    const existing = currentUhid ? this.patientsList().find(p => p.uhid && p.uhid.toLowerCase() === currentUhid.toLowerCase()) : null;
    const isUpdate = !!existing;

    const targetUhid = isUpdate ? currentUhid : ('RFH' + Math.floor(10000000 + Math.random() * 90000000));
    const fullName = `${val.title} ${val.firstName} ${val.middleName || ''} ${val.lastName}`.replace(/\s+/g, ' ').trim();

    const patientData = {
      uhid: targetUhid,
      registrationType: val.registrationType,
      title: val.title,
      name: fullName,
      firstName: val.firstName,
      middleName: val.middleName,
      lastName: val.lastName,
      mobile: val.mobileNo,
      whatsapp: val.whatsappNo,
      dob: val.dob,
      age: val.age,
      gender: val.gender,
      maritalStatus: val.maritalStatus,
      email: val.email,
      nationality: val.nationality,
      address: {
        houseNo: val.houseNo,
        street: val.streetLocality,
        city: val.city,
        state: val.state,
        pinCode: val.pinCode
      },
      bloodGroup: val.bloodGroup,
      updatedOn: new Date().toISOString()
    };

    if (isUpdate) {
      const updatedList = this.patientsList().map(p => p.uhid?.toLowerCase() === targetUhid.toLowerCase() ? { ...p, ...patientData, id: p.id } : p);
      this.patientsList.set(updatedList);

      if (existing.id) {
        this.apiService.put(`patients/${existing.id}`, { ...existing, ...patientData }).subscribe();
      } else {
        this.apiService.post('patients', patientData).subscribe();
      }
    } else {
      this.patientsList.update(list => [patientData, ...list]);
      this.apiService.post('patients', patientData).subscribe();
    }

    this.registeredUhid.set(targetUhid);
    this.isArrivalMarked.set(markArrival);

    if (markArrival) {
      const generatedVisitId = 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000);
      this.activeVisitId.set(generatedVisitId);

      const newAppointmentVisit = {
        dateStr: 'SAT 12 SEP',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        patientName: fullName,
        uhid: targetUhid,
        mobile: val.mobileNo,
        practitioner: 'General OPD Clinic',
        fee: 1500,
        status: 'CONFIRMED',
        type: 'OP',
        description: `Active Front Desk OP Visit (${generatedVisitId})`,
        bookedOn: new Date().toISOString()
      };

      this.apiService.post('appointments', newAppointmentVisit).subscribe();
      this.toastService.success(`Patient details ${isUpdate ? 'updated' : 'registered'} & Desk Arrival recorded! Visit ID: ${generatedVisitId}`);
    } else {
      this.activeVisitId.set('');
      this.toastService.success(`Patient profile for "${fullName}" (UHID: ${targetUhid}) ${isUpdate ? 'UPDATED' : 'REGISTERED'} successfully!`);
    }

    this.showSuccessModal.set(true);
  }

  goToOpBilling(): void {
    const val = this.patientForm.value;
    this.showSuccessModal.set(false);
    this.router.navigate(['/op-billing'], {
      queryParams: {
        name: `${val.title} ${val.firstName} ${val.lastName}`.trim(),
        uhid: this.registeredUhid(),
        visitId: this.activeVisitId() || 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000),
        mobile: val.mobileNo
      }
    });
  }

  closeModal(): void {
    this.showSuccessModal.set(false);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.toastService.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  openHelp(): void {
    this.toastService.info('Help documentation & video tutorials opening...');
  }
}
