import {
  Controller,
  Get,
  Req,
  UseGuards,
  Body,
  Patch,
  UseInterceptors,
  Post,
  UploadedFile,
  Delete,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { UpdateProfileDto } from './dto/update-user.dto';
import { createImageUploadOptions } from '../../utils/multer.util';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { UPLOAD_LIMITS } from '../../constants/upload.constant';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserResponse } from './responses/user.response';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PERMISSIONS } from '../../constants/permission.constant';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully.',
    type: UserResponse,
  })
  getMe(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update the profile of the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully.',
    type: UserResponse,
  })
  @ApiResponse({ status: 400, description: 'Invalid user data provided.' })
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Update the avatar of the authenticated user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary', // hiển thị nút "Choose File" trong Swagger UI
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User avatar updated successfully.',
    type: UserResponse,
  })
  @UseInterceptors(
    FileInterceptor('avatar', createImageUploadOptions(UPLOAD_LIMITS.AVATAR)),
  )
  updateAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(req.user.id, file);
  }

  @Get()
  @RequirePermissions([PERMISSIONS.USER.LIST])
  @ApiOperation({ summary: 'List users with filters' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully.',
    type: PaginatedResponse,
  })
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.USER.LIST])
  @ApiOperation({ summary: 'Get user detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully.',
    type: UserResponse,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @RequirePermissions([PERMISSIONS.USER.CREATE])
  @ApiOperation({ summary: 'Create a user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
    type: UserResponse,
  })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.USER.UPDATE])
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    type: UserResponse,
  })
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
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
    schema: { type: 'boolean' },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
