import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Crear un nuevo perfil' })
  @ApiCreatedResponse({
    description: 'El perfil ha sido creado exitosamente.',
  })
  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @ApiOperation({ summary: 'Obtener todos los perfiles' })
  @ApiOkResponse({
    description: 'Devuelve todos los perfiles.',
    type: [CreateProfileDto],
  })
  @Get()
  findAll() {
    return this.profileService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un perfil por ID' })
  @ApiOkResponse({ description: 'Devuelve un perfil.', type: CreateProfileDto })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(+id);
  }

  @ApiOperation({ summary: 'Obtener un perfil por ID de usuario' })
  @ApiOkResponse({ description: 'Devuelve un perfil.', type: CreateProfileDto })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado.' })
  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.profileService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Actualizar un perfil por ID' })
  @ApiOkResponse({ description: 'El perfil ha sido actualizado exitosamente.' })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+id, updateProfileDto);
  }

  @ApiOperation({ summary: 'Eliminar un perfil por ID' })
  @ApiNoContentResponse({
    description: 'El perfil ha sido eliminado exitosamente.',
  })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}
