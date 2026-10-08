import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '../../common/types/auth-request';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista los usuarios (id, nombre, correo) para asignar integrantes y responsables' })
  findAll() {
    return this.usersService.findAllPublic();
  }

  // IMPORTANTE: 'me' va antes de ':id' o Nest lo interpretaría como un id.
  @Get('me')
  @ApiOperation({ summary: 'Perfil del usuario autenticado (RF-26)' })
  async me(@Req() req: AuthRequest) {
    const user = await this.usersService.findPublicById(req.user.userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  @Patch('me')
  @ApiOperation({ summary: 'Edita el nombre del perfil del usuario autenticado (RF-26)' })
  updateMe(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateName(req.user.userId, dto.name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un usuario por id (sin datos sensibles)' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findPublicById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
