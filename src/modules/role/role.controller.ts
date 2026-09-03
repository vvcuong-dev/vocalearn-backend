import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../constants/permission.constant';
import { QueryRoleDto } from './dto/query-role.dto';

@ApiTags('Role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions([PERMISSIONS.ROLE.CREATE])
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Get()
  @RequirePermissions([PERMISSIONS.ROLE.LIST])
  @ApiOperation({ summary: 'List roles with pagination & search' })
  findAll(@Query() query: QueryRoleDto) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.ROLE.LIST])
  @ApiOperation({ summary: 'Get role detail with permissions' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.ROLE.UPDATE])
  @ApiOperation({ summary: 'Update role info' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.ROLE.DELETE])
  @ApiOperation({ summary: 'Soft delete role' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.delete(id);
  }

  @Post(':id/permissions')
  @RequirePermissions([PERMISSIONS.ROLE.ASSIGN_PERMISSION])
  @ApiOperation({ summary: 'Assign (replace) permissions for a role' })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.roleService.assignPermissions(id, dto);
  }
}
