import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import { PERMISSIONS } from '../../constants/permission.constant';
import { UserResponse } from './responses/user.response';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, ActorGuard, PermissionsGuard)
@RequireActor(ActorType.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.USER.LIST])
  @ApiOperation({ summary: 'List users with filters' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.USER.LIST])
  @ApiOperation({ summary: 'Get user detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: UserResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @RequirePermissions([PERMISSIONS.USER.CREATE])
  @ApiOperation({ summary: 'Create a user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserResponse })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.USER.UPDATE])
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponse })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.USER.DELETE])
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
