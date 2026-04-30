import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../domain/entities/patient.entity';
import { User } from '../../domain/entities/user.entity';
import { LoginDto } from '../../presentation/dto/login.dto';
import { RegisterDto } from '../../presentation/dto/register.dto';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import {
  DecodedToken,
  KeycloakTokenResponse,
  AxiosErrorResponse,
  UserData,
  DbUser,
} from '../../domain/types/keycloak.types';

@Injectable()
export class AuthService {
  private keycloakUrl = process.env.KEYCLOAK_URL || 'http://127.0.0.1:8080';
  private realm = process.env.KEYCLOAK_REALM || 'piedrazul';
  private clientId = process.env.KEYCLOAK_CLIENT_ID || 'piedrazul-app';
  // En producción, usa un cliente confidencial con Client Secret
  // private clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'secret';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Validar si ya existe localmente
    const existing = await this.patientRepository.findOneBy({
      document: dto.document,
    });
    if (existing) {
      throw new ConflictException('El documento ya está registrado.');
    }

    // Opcional: Aquí podrías hacer una petición HTTP POST al Admin API de Keycloak
    // para crear al usuario allá también. Por ahora, asumimos que se registra local.
    // (Ver documentación de Keycloak Admin REST API)

    // Hash local (solo por seguridad si alguna vez apagas Keycloak)
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const patient = this.patientRepository.create({
      ...dto,
      password: hashedPassword,
    });

    await this.patientRepository.save(patient);

    // AUTO-PROVISIONING: Sincronizar automáticamente con Keycloak
    // Esto evita que el usuario tenga que ser creado manualmente por el admin
    try {
      // 1. Obtener token de administrador de Keycloak (usando las credenciales locales de dev)
      const adminTokenUrl = `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`;
      const adminParams = new URLSearchParams();
      adminParams.append('client_id', 'admin-cli');
      adminParams.append('grant_type', 'password');
      adminParams.append('username', process.env.KEYCLOAK_ADMIN || 'admin');
      adminParams.append(
        'password',
        process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
      );

      const adminTokenRes = await axios.post<KeycloakTokenResponse>(
        adminTokenUrl,
        adminParams,
      );
      const adminToken = adminTokenRes.data.access_token;

      // 2. Crear usuario en el Realm 'piedrazul'
      const usersUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;
      await axios.post(
        usersUrl,
        {
          username: dto.document, // En nuestro sistema, el documento es el username de Keycloak
          enabled: true,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          credentials: [
            {
              type: 'password',
              value: dto.password,
              temporary: false, // Muy importante para que el login directo funcione
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      console.log(
        `[Auto-Provisioning] Paciente ${dto.document} sincronizado con Keycloak exitosamente.`,
      );
    } catch (kcError) {
      const errorResponse = kcError as AxiosErrorResponse;
      console.error(
        '[Auto-Provisioning] Advertencia: No se pudo crear el usuario en Keycloak automáticamente.',
        errorResponse?.response?.data?.message || errorResponse?.message,
      );
      // No detenemos el flujo, pero el login subsiguiente va a fallar si Keycloak no lo tiene.
    }

    // 2. Intentar loguearse
    return this.login({ login: dto.document, password: dto.password });
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; user: UserData | null; source: string }> {
    try {
      // Delegamos la autenticación a Keycloak (Direct Access Grants)
      const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;

      const params = new URLSearchParams();
      params.append('client_id', this.clientId);
      params.append('grant_type', 'password');
      params.append('username', dto.login);
      params.append('password', dto.password);

      const response = await axios.post<KeycloakTokenResponse>(
        tokenUrl,
        params,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      // Keycloak nos devuelve el access_token
      const accessToken = response.data.access_token;

      // Decodificar el token para obtener el 'sub' (Keycloak UUID)
      const decodedToken: DecodedToken = this.jwtService.decode(accessToken);
      const keycloakSub = decodedToken?.sub;

      // 2. Buscar datos extendidos en nuestra BD local (Híbrido)
      let userData: UserData | null = null;

      // Intentar buscar como paciente (usando el login que suele ser el documento o email)
      const patient = await this.patientRepository.findOneBy([
        { document: dto.login },
        { email: dto.login },
      ]);

      if (patient) {
        // LAZY IDENTITY LINKING: Si encontramos al paciente local pero no tiene keycloakId, lo vinculamos
        if (!patient.keycloakId && keycloakSub) {
          patient.keycloakId = keycloakSub;
          await this.patientRepository.save(patient);
        }

        userData = {
          id: patient.id,
          document: patient.document,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          role: 'patient',
        };
      } else {
        // Si no es paciente, buscar en la tabla de usuarios administrativos (Admin, Doctor, Staff)
        const staffUser = await this.userRepository.findOneBy({
          email: dto.login,
        });
        if (staffUser) {
          // LAZY IDENTITY LINKING: Para el staff
          if (!staffUser.keycloakId && keycloakSub) {
            staffUser.keycloakId = keycloakSub;
            await this.userRepository.save(staffUser);
          }

          userData = {
            id: staffUser.id,
            email: staffUser.email,
            firstName: staffUser.firstName,
            lastName: staffUser.lastName,
            role: staffUser.role,
          };
        }
      }

      return {
        access_token: accessToken,
        user: userData,
        source: 'keycloak',
      };
    } catch (error) {
      const errorResponse = error as AxiosErrorResponse;
      console.error(
        'Error autenticando con Keycloak:',
        errorResponse?.response?.data?.message || errorResponse?.message,
      );

      // Fallback: Si Keycloak falla o no está configurado, podemos intentar con la BD Local (Opcional)
      // Si quieres que SOLO funcione con Keycloak, borra este bloque.
      return this.localLoginFallback(dto);
    }
  }

  private async localLoginFallback(dto: LoginDto): Promise<never> {
    console.warn('⚠️ Usando BD Local para Login (Fallback)');

    // 1. Buscar en Pacientes
    let dbUser: DbUser | null = await this.patientRepository.findOne({
      where: [{ document: dto.login }, { email: dto.login }],
      select: ['id', 'firstName', 'lastName', 'password', 'document', 'email'],
    });

    // 2. Si no es paciente, buscar en Usuarios Administrativos
    if (!dbUser) {
      dbUser = await this.userRepository.findOne({
        where: { email: dto.login },
        select: ['id', 'firstName', 'lastName', 'password', 'email', 'role'],
      });
    }

    if (
      dbUser &&
      dbUser.password &&
      (await bcrypt.compare(dto.password, dbUser.password))
    ) {
      // Como estamos en un flujo Keycloak, el fallback local sin Keycloak
      // solo sirve para validar que el usuario existe, pero no podemos dar un token válido.
      throw new InternalServerErrorException(
        'Autenticación local exitosa, pero Keycloak no respondió. No se puede generar una sesión segura.',
      );
    }
    throw new UnauthorizedException('Credenciales inválidas.');
  }

  async getPatientByDocument(document: string) {
    const patient = await this.patientRepository.findOne({
      where: { document },
      select: [
        'id',
        'firstName',
        'lastName',
        'document',
        'phone',
        'gender',
        'birthDate',
        'email',
      ],
    });

    if (!patient) {
      throw new UnauthorizedException('Paciente no encontrado.');
    }

    return patient;
  }
}
