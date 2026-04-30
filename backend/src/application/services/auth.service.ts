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

@Injectable()
export class AuthService {
  private keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  private realm = process.env.KEYCLOAK_REALM || 'piedrazul';
  private clientId = process.env.KEYCLOAK_CLIENT_ID || 'piedrazul-app';
  // En producción, usa un cliente confidencial con Client Secret
  // private clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'secret';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
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
    
    // 2. Intentar loguearse
    return this.login({ login: dto.document, password: dto.password });
  }

  async login(dto: LoginDto) {
    try {
      // Delegamos la autenticación a Keycloak (Direct Access Grants)
      const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
      
      const params = new URLSearchParams();
      params.append('client_id', this.clientId);
      params.append('grant_type', 'password');
      params.append('username', dto.login);
      params.append('password', dto.password);
      
      const response = await axios.post(tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Keycloak nos devuelve el access_token
      const accessToken = response.data.access_token;

      // Opcional: Podrías buscar al paciente en tu BD local para devolver sus datos
      let userData = {};
      const patient = await this.patientRepository.findOneBy({ document: dto.login });
      if (patient) {
        userData = { id: patient.id, document: patient.document, name: patient.firstName };
      }

      return {
        access_token: accessToken,
        user: userData,
        source: 'keycloak'
      };
    } catch (error) {
      console.error('Error autenticando con Keycloak:', error?.response?.data || error.message);
      
      // Fallback: Si Keycloak falla o no está configurado, podemos intentar con la BD Local (Opcional)
      // Si quieres que SOLO funcione con Keycloak, borra este bloque.
      return this.localLoginFallback(dto);
    }
  }

  private async localLoginFallback(dto: LoginDto) {
    console.warn('⚠️ Usando BD Local para Login (Fallback)');
    const patient = await this.patientRepository.findOne({
      where: [{ document: dto.login }, { email: dto.login }],
      select: ['id', 'firstName', 'lastName', 'password', 'document', 'phone', 'gender'],
    });

    if (patient && patient.password && (await bcrypt.compare(dto.password, patient.password))) {
      // Como ya no inyectamos JwtService, no podemos firmar tokens aquí fácilmente.
      // Si Keycloak falla, deberíamos lanzar UnauthorizedException en producción.
      throw new InternalServerErrorException('El servidor de identidad (Keycloak) no está disponible.');
    }
    throw new UnauthorizedException('Credenciales inválidas.');
  }

  async getPatientByDocument(document: string) {
    const patient = await this.patientRepository.findOne({
      where: { document },
      select: ['id', 'firstName', 'lastName', 'document', 'phone', 'gender', 'birthDate', 'email'],
    });

    if (!patient) {
      throw new UnauthorizedException('Paciente no encontrado.');
    }

    return patient;
  }
}
