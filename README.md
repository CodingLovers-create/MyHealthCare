# MyHealthcare (MHC) - Hospital Information System

Enterprise-grade Hospital Information System (HIS) web application built with **Angular 18 Standalone Component Architecture**, **RxJS**, **Angular Signals**, and a **JSON REST API Backend**.

---

## 🚀 How to Run the Project

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Step 1: Install Dependencies
Open a terminal in the project root directory and run:

```bash
npm install
```

---

### Step 2: Start the REST API Backend Server
The backend runs on `json-server` and persists data in `db.json` at `http://localhost:3000`.

In Terminal Window 1, run:

```bash
npm run api
```

> **API Server URL**: `http://localhost:3000`  
> *(Endpoints available: `/users`, `/patients`, `/appointments`, `/doctors`, `/services`)*

---

### Step 3: Start the Angular Frontend Application
The Angular development server serves the app at `http://localhost:4200`.

In Terminal Window 2, run:

```bash
npm start
```
*(or `ng serve`)*

> **Application Web URL**: `http://localhost:4200`

---

### ⚡ Option: Run Both Frontend & Backend Concurrently
You can also launch both servers with a single command:

```bash
npm run dev
```

---

## 🔑 Login Credentials

Use the following credentials to test different user roles:

| Username | Password | Full Name | Role Title | Available Modules / Access |
| :--- | :--- | :--- | :--- | :--- |
| **`prathamesh`** | **`Welcome@123`** | Mr. PRATHAMESH KHOCHADE | Administrator | **Full Access** (*MyDesk, MagicSearch, Registration, Doctor Appointments, Billing*) |
| **`priya`** | **`Welcome@123`** | Priya Sharma | Patient Executive | **Doctor Appointments** |
| **`rahul`** | **`Welcome@123`** | Rahul Yadav | Administrator | **Full Access** |
| **`kavita`** | **`Welcome@123`** | Kavita Rane | Staff Nurse | **Vitals Recording** |
| **`susheel`** | **`Welcome@123`** | Dr. Susheel Bindroo | Consultant Physician | **OPD Queue & Consultation** |

---

## 🗺️ Application Routes

| Route Path | Feature Component | Description |
| :--- | :--- | :--- |
| `/login` | `LoginComponent` | Template-driven authentication gateway |
| `/dashboard` | `DashboardComponent` | **MyDesk Worklist**: Metric cards, active patient list, cancellation modal |
| `/magic-search` | `MagicSearchComponent` | **Magic Search**: Global multi-field patient lookup & drawer |
| `/doctor-appointment` | `DoctorAppointmentComponent` | **Doctor Appointment**: Doctor schedule grids, slot hover popover tooltips, booking/cancellation |
| `/registration` | `PatientRegistrationComponent` | **Patient Registration**: Multi-section demographic form with auto-formatted UHID |
| `/op-billing` | `OpBillingComponent` | **OP Billing & Cashier**: Itemized billing calculator using `InrCurrencyPipe` |
| `/vitals-recording` | `VitalsRecordingComponent` | **Vitals Recording**: Clinical vitals entry for staff nurses |
| `/doctor-patient-list` | `DoctorPatientListComponent` | **OPD Queue**: Physician queue management & clinical consultation launcher |

---

## 🏗️ Architecture & Angular Best Practices

- **Standalone Components (`standalone: true`)**: Lightweight dependency tree without legacy `NgModule` declarations.
- **RxJS `BehaviorSubject` State Stream**: `AuthService.currentUser$` stream maintains reactive user session across top navigation (`NavbarComponent`) and application modules.
- **Angular Signals**: Fine-grained reactivity using `signal()`, `computed()`, and `update()` for UI state without Zone.js overhead.
- **Custom Directives**: `PriorityHighlightDirective` (`[appPriorityHighlight]`) applies visual crimson accents for high-priority appointments.
- **Custom Pipes**: `UhidFormatPipe` (`| uhidFormat`) for standardizing UHIDs (`0010-72-3243`) and `InrCurrencyPipe` (`| inrCurrency`) for Indian Rupee price formatting (`₹ 1,800.00`).
- **Multi-Slot Content Projection**: `CardContainerComponent` & `InfoCardComponent` using `<ng-content select="[card-header]">`.

---

## 📚 Technical Documentation & Guides

- 📄 **[PDF Architectural Guide](./MyHealthcare_Angular_Architecture_Guide.pdf)**: Complete PDF documentation covering execution flows, state diagrams, and concept matrices.
