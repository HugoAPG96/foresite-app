import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ProjectsService } from '../../modules/projects/projects.service';
import { AuthRequest } from '../types/auth-request';

/**
 * Solo el dueño (creador) o un integrante del proyecto puede usar las rutas
 * `projects/:projectId/...`. Debe ir después de JwtAuthGuard.
 * 404 si el proyecto no existe, 403 si el usuario no pertenece a él.
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private readonly projects: ProjectsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    await this.projects.assertAccess(req.params.projectId, req.user.userId);
    return true;
  }
}
