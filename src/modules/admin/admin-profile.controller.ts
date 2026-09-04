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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { createImageUploadOptions } from '../../utils/multer.util';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { UPLOAD_LIMITS } from '../../constants/upload.constant';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminResponse } from './responses/admin.response';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@ApiTags('Admin - Profile')
@ApiBearerAuth()
@Controller('admin/profile')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.ADMIN)
export class AdminProfileController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get the profile of the authenticated admin' })
  @ApiResponse({ status: 200, type: AdminResponse })
  getMe(@Req() req: RequestWithUser) {
    return this.adminService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the profile of the authenticated admin' })
  @ApiResponse({ status: 200, type: AdminResponse })
  updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateAdminProfileDto,
  ) {
    return this.adminService.updateProfile(req.user.id, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Update the avatar of the authenticated admin' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, type: AdminResponse })
  @UseInterceptors(
    FileInterceptor('avatar', createImageUploadOptions(UPLOAD_LIMITS.AVATAR)),
  )
  updateAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.adminService.updateAvatar(req.user.id, file);
  }
}
