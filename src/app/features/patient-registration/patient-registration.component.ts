import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../core/services/sidebar.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './patient-registration.component.html'
})
export class PatientRegistrationComponent implements OnInit {
  private apiService = inject(ApiService);
  // ...
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
  
  // Registration Form Signals
  registrationType = signal<string>('General');
  mobileCountryCode = signal<string>('+91');
  mobileNo = signal<string>('');
  whatsappCountryCode = signal<string>('+91');
  whatsappNo = signal<string>('');
  uhid = signal<string>('');

  // Existing Patient Matching Popup Signals
  patientsList = signal<any[]>([
    { uhid: 'RFH2026001', name: 'Jagdish Ramji Thakkar', title: 'Mr.', firstName: 'Jagdish', lastName: 'Thakkar', mobile: '9820198201', age: '58', gender: 'Male', city: 'Mumbai', state: 'Maharashtra' },
    { uhid: 'RFH2026002', name: 'Mohd. Zubair Qureshi', title: 'Mr.', firstName: 'Mohd.', lastName: 'Qureshi', mobile: '9819283746', age: '42', gender: 'Male', city: 'Mumbai', state: 'Maharashtra' },
    { uhid: 'RFH23241854', name: 'Mr. PRATHAMESH SHASHANK KHOCHADE', title: 'Mr.', firstName: 'Prathamesh', lastName: 'Khochade', mobile: '9892011223', age: '30', gender: 'Male', city: 'Mumbai', state: 'Maharashtra' },
    { uhid: 'RFH2026003', name: 'Anuradha Jadhav', title: 'Mrs.', firstName: 'Anuradha', lastName: 'Jadhav', mobile: '9765432109', age: '35', gender: 'Female', city: 'Mumbai', state: 'Maharashtra' },
    { uhid: 'RFH2026005', name: 'Pooja Dhanecha', title: 'Ms.', firstName: 'Pooja', lastName: 'Dhanecha', mobile: '9123456789', age: '31', gender: 'Female', city: 'Mumbai', state: 'Maharashtra' }
  ]);

  matchingPatientsList = signal<any[]>([]);
  showMatchingPatientsDropdown = signal<boolean>(false);

  isExistingPatient = computed(() => {
    const currentUhid = this.uhid().trim();
    if (!currentUhid) return false;
    return this.patientsList().some(p => p.uhid && p.uhid.toLowerCase() === currentUhid.toLowerCase());
  });

  ngOnInit(): void {
    this.apiService.get<any[]>('patients').subscribe({
      next: (apiData) => {
        if (Array.isArray(apiData) && apiData.length > 0) {
          const loaded = apiData.map(p => ({
            uhid: p.uhid || 'RFH2026' + Math.floor(1000 + Math.random() * 9000),
            name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            title: p.title || 'Mr.',
            firstName: p.firstName || p.name?.split(' ')[0] || '',
            middleName: p.middleName || '',
            lastName: p.lastName || p.name?.split(' ').slice(-1)[0] || '',
            mobile: p.mobile ? p.mobile.replace(/\+91\s?/, '') : '9820198201',
            age: p.age || '32',
            gender: p.gender || 'Male',
            dob: p.dob || '',
            email: p.email || '',
            city: p.address?.city || p.city || 'Mumbai',
            state: p.address?.state || p.state || 'Maharashtra',
            houseNo: p.address?.houseNo || p.houseNo || '',
            streetLocality: p.address?.street || p.streetLocality || '',
            pinCode: p.address?.pinCode || p.pinCode || ''
          }));
          const existingUhids = new Set(loaded.map(p => p.uhid));
          const combined = [
            ...loaded,
            ...this.patientsList().filter(dp => !existingUhids.has(dp.uhid))
          ];
          this.patientsList.set(combined);
        }
      }
    });
  }

  onMobileInputChange(val: string): void {
    this.mobileNo.set(val);
    const cleanVal = val.trim().replace(/\+91\s?/, '');
    if (cleanVal.length >= 3) {
      const matches = this.patientsList().filter(p => 
        (p.mobile && p.mobile.includes(cleanVal)) || 
        (p.name && p.name.toLowerCase().includes(cleanVal.toLowerCase()))
      );
      this.matchingPatientsList.set(matches);
      this.showMatchingPatientsDropdown.set(matches.length > 0);
    } else {
      this.matchingPatientsList.set([]);
      this.showMatchingPatientsDropdown.set(false);
    }
  }

  selectExistingPatient(p: any): void {
    if (p.title) this.title.set(p.title);
    if (p.firstName) this.firstName.set(p.firstName);
    if (p.middleName) this.middleName.set(p.middleName);
    if (p.lastName) this.lastName.set(p.lastName);
    if (p.mobile) this.mobileNo.set(p.mobile);
    if (p.uhid) this.uhid.set(p.uhid);
    if (p.dob) this.dob.set(p.dob);
    if (p.age) this.age.set(p.age);
    if (p.gender) this.gender.set(p.gender);
    if (p.email) this.email.set(p.email);
    if (p.city) this.city.set(p.city);
    if (p.state) this.state.set(p.state);
    if (p.houseNo) this.houseNo.set(p.houseNo);
    if (p.streetLocality) this.streetLocality.set(p.streetLocality);
    if (p.pinCode) this.pinCode.set(p.pinCode);

    this.showMatchingPatientsDropdown.set(false);
    this.toastService.success(`Loaded profile for "${p.name || p.firstName}" (UHID: ${p.uhid})`);
  }
  
  aadharId = signal<string>('');
  abhaId = signal<string>('');
  title = signal<string>('Mr.');
  firstName = signal<string>('');
  middleName = signal<string>('');
  lastName = signal<string>('');
  
  dob = signal<string>('');
  isAgeChecked = signal<boolean>(false);
  age = signal<string>('');
  ageUnit = signal<string>('Year');
  gender = signal<string>('Male');
  maritalStatus = signal<string>('Single');
  fatherSpouseType = signal<string>('Father');
  fatherSpouseName = signal<string>('');
  
  isEmailNA = signal<boolean>(false);
  email = signal<string>('');
  nationality = signal<string>('Indian');
  panCardNo = signal<string>('');
  
  emergencyContactName = signal<string>('');
  relation = signal<string>('Spouse');
  emergencyCountryCode = signal<string>('+91');
  emergencyNo = signal<string>('');
  registrationSource = signal<string>('Walk-in');
  
  employmentStatus = signal<string>('');
  grade = signal<string>('');
  department = signal<string>('');
  plant = signal<string>('');
  employeeCadre = signal<string>('');

  // Photo & Document Upload State
  capturedPhoto = signal<string | null>(null);

  // Address Section Tab & Fields
  activeAddressTab = signal<'present' | 'permanent' | 'other' | 'family'>('present');
  
  // Present Address
  country = signal<string>('India');
  pinCode = signal<string>('');
  houseNo = signal<string>('');
  streetLocality = signal<string>('');
  state = signal<string>('Maharashtra');
  city = signal<string>('Mumbai');
  area = signal<string>('');
  
  // Permanent Address
  permCountry = signal<string>('India');
  permPinCode = signal<string>('');
  permHouseNo = signal<string>('');
  permStreetLocality = signal<string>('');
  permState = signal<string>('Maharashtra');
  permCity = signal<string>('Mumbai');
  permArea = signal<string>('');
  
  isSameAddress = signal<boolean>(false);

  // Other details
  occupation = signal<string>('');
  bloodGroup = signal<string>('O+');
  referredBy = signal<string>('');

  // Family details
  kinName = signal<string>('');
  kinRelation = signal<string>('Spouse');
  kinContact = signal<string>('');

  // Payor Details
  payorType = signal<'self' | 'corporate' | 'insurance'>('self');
  corporateName = signal<string>('');
  employeeId = signal<string>('');
  insuranceCompany = signal<string>('');
  tpaCardNo = signal<string>('');

  // Consents
  consentResearch = signal<boolean>(true);
  consentPromotional = signal<boolean>(true);

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
    return this.citiesByState[this.state()] || ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai'];
  });

  availablePermCities = computed(() => {
    return this.citiesByState[this.permState()] || ['Mumbai', 'Pune', 'Thane', 'Navi Mumbai'];
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
    }
  }

  selectAddressTab(tab: 'present' | 'permanent' | 'other' | 'family'): void {
    this.activeAddressTab.set(tab);
  }

  onStateChange(newState: string): void {
    this.state.set(newState);
    const cities = this.citiesByState[newState];
    if (cities && cities.length > 0) {
      this.city.set(cities[0]);
    }
  }

  onPermStateChange(newState: string): void {
    this.permState.set(newState);
    const cities = this.citiesByState[newState];
    if (cities && cities.length > 0) {
      this.permCity.set(cities[0]);
    }
  }

  onDobChange(dobValue: string): void {
    this.dob.set(dobValue);
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
          this.age.set(years.toString());
          this.ageUnit.set('Year');
        } else {
          let months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
          if (months >= 1) {
            this.age.set(months.toString());
            this.ageUnit.set('Month');
          } else {
            const diffTime = Math.abs(today.getTime() - birthDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            this.age.set(diffDays.toString());
            this.ageUnit.set('Day');
          }
        }
        this.isAgeChecked.set(true);
      }
    }
  }

  toggleEmailNA(checked: boolean): void {
    this.isEmailNA.set(checked);
    if (checked) {
      this.email.set('');
    }
  }

  toggleSameAddress(checked: boolean): void {
    this.isSameAddress.set(checked);
    if (checked) {
      this.permCountry.set(this.country());
      this.permPinCode.set(this.pinCode());
      this.permHouseNo.set(this.houseNo());
      this.permStreetLocality.set(this.streetLocality());
      this.permState.set(this.state());
      this.permCity.set(this.city());
      this.permArea.set(this.area());
    }
  }

  setPayorType(type: 'self' | 'corporate' | 'insurance'): void {
    this.payorType.set(type);
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
    this.mobileNo.set('');
    this.whatsappNo.set('');
    this.uhid.set('');
    this.aadharId.set('');
    this.abhaId.set('');
    this.firstName.set('');
    this.middleName.set('');
    this.lastName.set('');
    this.dob.set('');
    this.age.set('');
    this.isAgeChecked.set(false);
    this.email.set('');
    this.isEmailNA.set(false);
    this.emergencyContactName.set('');
    this.emergencyNo.set('');
    this.employmentStatus.set('');
    this.grade.set('');
    this.department.set('');
    this.plant.set('');
    this.employeeCadre.set('');
    this.pinCode.set('');
    this.houseNo.set('');
    this.streetLocality.set('');
    this.area.set('');
    this.isSameAddress.set(false);
    this.corporateName.set('');
    this.employeeId.set('');
    this.insuranceCompany.set('');
    this.tpaCardNo.set('');
    this.capturedPhoto.set(null);
    this.toastService.info('Registration form cleared.');
  }

  onPrint(): void {
    window.print();
  }

  activeVisitId = signal<string>('');
  isArrivalMarked = signal<boolean>(false);

  onRegister(markArrival: boolean = false): void {
    if (!this.firstName().trim()) {
      this.toastService.warning('Please enter First Name.');
      return;
    }
    if (!this.lastName().trim()) {
      this.toastService.warning('Please enter Last Name.');
      return;
    }
    if (!this.mobileNo().trim()) {
      this.toastService.warning('Please enter Mobile No.');
      return;
    }

    const currentUhid = this.uhid().trim();
    const existing = currentUhid ? this.patientsList().find(p => p.uhid && p.uhid.toLowerCase() === currentUhid.toLowerCase()) : null;
    const isUpdate = !!existing;

    const targetUhid = isUpdate ? currentUhid : ('RFH' + Math.floor(10000000 + Math.random() * 90000000));
    const fullName = `${this.title()} ${this.firstName()} ${this.middleName()} ${this.lastName()}`.replace(/\s+/g, ' ').trim();

    const patientData = {
      uhid: targetUhid,
      registrationType: this.registrationType(),
      title: this.title(),
      name: fullName,
      firstName: this.firstName(),
      middleName: this.middleName(),
      lastName: this.lastName(),
      mobile: this.mobileNo(),
      whatsapp: this.whatsappNo(),
      dob: this.dob(),
      age: this.age(),
      gender: this.gender(),
      maritalStatus: this.maritalStatus(),
      email: this.email(),
      nationality: this.nationality(),
      address: {
        houseNo: this.houseNo(),
        street: this.streetLocality(),
        city: this.city(),
        state: this.state(),
        pinCode: this.pinCode()
      },
      bloodGroup: this.bloodGroup(),
      updatedOn: new Date().toISOString()
    };

    if (isUpdate) {
      // Update existing patient in patientsList signal
      const updatedList = this.patientsList().map(p => p.uhid?.toLowerCase() === targetUhid.toLowerCase() ? { ...p, ...patientData, id: p.id } : p);
      this.patientsList.set(updatedList);

      // Save update to JSON Server
      if (existing.id) {
        this.apiService.put(`patients/${existing.id}`, { ...existing, ...patientData }).subscribe();
      } else {
        this.apiService.post('patients', patientData).subscribe();
      }
    } else {
      // Create new patient
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
        mobile: this.mobileNo(),
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
    this.showSuccessModal.set(false);
    this.router.navigate(['/op-billing'], {
      queryParams: {
        name: `${this.title()} ${this.firstName()} ${this.lastName()}`.trim(),
        uhid: this.registeredUhid(),
        visitId: this.activeVisitId() || 'OPV-2026-' + Math.floor(10000 + Math.random() * 90000),
        mobile: this.mobileNo()
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

