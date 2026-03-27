import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'PIEDRAZUL_SECRET_KEY', // Debe ser env var en producción
    });
  }

  validate(payload: { sub: string; document: string }) {
    return { id: payload.sub, document: payload.document };
  }
}
