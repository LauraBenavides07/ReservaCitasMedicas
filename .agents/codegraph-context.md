## Code Context

**Query:** Sistema de reserva de citas medicas Piedrazul

### Entry Points

- **appointments** (method) - frontend/src/app/components/appointment-list/appointment-list.component.ts:24
- **total** (method) - frontend/src/app/components/appointment-list/appointment-list.component.ts:30
- **doctorService** (method) - frontend/src/app/components/patient-appointment-form/patient-appointment-form.component.ts:30

### Related Symbols

- frontend/src/app/components/appointment-list/appointment-list.component.ts: AppointmentListComponent:18
- frontend/src/app/services/appointment.service.ts: Appointment:13
- frontend/src/app/components/patient-appointment-form/patient-appointment-form.component.ts: PatientAppointmentFormComponent:23

### Code

#### appointments (frontend/src/app/components/appointment-list/appointment-list.component.ts:24)

```typescript
  appointments: Appointment[] = [];
```

#### total (frontend/src/app/components/appointment-list/appointment-list.component.ts:30)

```typescript
  total: number = 0;
```

#### doctorService (frontend/src/app/components/patient-appointment-form/patient-appointment-form.component.ts:30)

```typescript
  private doctorService = inject(DoctorService);       // Servicio de m├®dicos
```

#### AppointmentListComponent (frontend/src/app/components/appointment-list/appointment-list.component.ts:18)

```typescript
export class AppointmentListComponent implements OnInit {
  
  //modo de vista
  viewMode: 'all' | 'filter' = 'all';

  // Lista de citas
  appointments: Appointment[] = [];

  // Lista de doctores
  doctors: Doctor[] = [];

  // Total de citas
  total: number = 0;

  // Doctor seleccionado
  selectedDoctorId: string | null = null;

  // Fecha seleccionada (por defecto hoy, formato local)
  selectedDate: string = new Date().toLocaleDateString('en-CA');

  // Estado de carga
  loading: boolean = false;

  // Indica si ya se hizo una b├║squeda
  hasSearched: boolean = false;

  // Rescheduling state
  isRescheduleModalOpen: boolean = false;
  selectedAppointment: Appointment | null = null;
  newRescheduleDate: string = '';
  newRescheduleTime: string = '';
  availableSlots: string[] = [];
  isLoadingSlots: boolean = false;
  rescheduleDoctorId: string = '';
  touchedRescheduleDate: boolean = false;
  touchedRescheduleTime: boolean = false;

  constructor(
    private appointmentService: AppointmentService,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef
  ) { }

  // Se ejecuta al iniciar el componente
  ngOnInit(): void {
    this.loadDoctors();
  }

  // Carga la lista de doctores
  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (docs) => {
        this.doctors = docs;

        // Selecciona el primer doctor autom├íticamente
        if (docs.length > 0) {
    
... (truncated) ...
```

#### PatientAppointmentFormComponent (frontend/src/app/components/patient-appointment-form/patient-appointment-form.component.ts:23)

```typescript
export class PatientAppointmentFormComponent implements OnInit {
  // Evento de salida para navegaci├│n hacia el componente padre
  @Output() navigate = new EventEmitter<any>();

  // Inyecci├│n de dependencias
  auth = inject(AuthService);                          // Servicio de autenticaci├│n
  private appointmentService = inject(AppointmentService);  // Servicio de citas
  private doctorService = inject(DoctorService);       // Servicio de m├®dicos

  // Se├▒ales para estado reactivo del componente
  step = signal<number>(1);                           // Paso actual del wizard (1-4)
  doctors = signal<Doctor[]>([]);                     // Lista de m├®dicos disponibles
  selectedDoctor = signal<Doctor | null>(null);       // M├®dico seleccionado

  availableDates = signal<UIDate[]>([]);              // Fechas disponibles para el m├®dico
  selectedDate = signal<UIDate | null>(null);         // Fecha seleccionada

  availableSlots = signal<string[]>([]);              // Horarios disponibles
  selectedTime = signal<string>('');                  // Horario seleccionado

  isSubmitting = signal(false);                       // Estado de env├¡o del formulario
  successMessage = signal('');                        // Mensaje de ├®xito
  errorMessage = signal('');                          // Mensaje de error

  // M├®todo que se ejecuta al inicializar el componente
  ngOnInit(): void {
    // Carga la lista de m├®dicos desde el servicio
    this.doctorService.getDocto
... (truncated) ...
```

