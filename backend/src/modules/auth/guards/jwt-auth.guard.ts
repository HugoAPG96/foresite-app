import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protege cualquier ruta con @UseGuards(JwtAuthGuard).
 * Se apoya en JwtStrategy (registrada como estrategia por defecto 'jwt').
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
