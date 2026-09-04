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
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { UpdateProfileDto } from './dto/update-user.dto';
import { createImageUploadOptions } from '../../utils/multer.util';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { UPLOAD_LIMITS } from '../../constants/upload.constant';
import { UserResponse } from './responses/user.response';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('User - Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class UserProfileController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiResponse({ status: 200, type: UserResponse })
  getMe(@Req() req: RequestWithUser) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the profile of the authenticated user' })
  @ApiResponse({ status: 200, type: UserResponse })
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Update the avatar of the authenticated user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { avatar: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, type: UserResponse })
  @UseInterceptors(
    FileInterceptor('avatar', createImageUploadOptions(UPLOAD_LIMITS.AVATAR)),
  )
  updateAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateAvatar(req.user.id, file);
  }
}
