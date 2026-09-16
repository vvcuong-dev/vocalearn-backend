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
  Query,
} from '@nestjs/common';
import { MeService } from './me.service';
import { QueryLibraryDto } from './dto/query-library.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { UpdateProfileDto } from '../user/dto/update-user.dto';
import { createImageUploadOptions } from '../../utils/multer.util';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { UPLOAD_LIMITS } from '../../constants/upload.constant';
import { UserResponse } from '../user/responses/user.response';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('library')
  @ApiOperation({
    summary:
      'List your folders and standalone word sets with shared pagination',
    description:
      'Folders first, then standalone word sets. Each type is sorted by createdAt descending, then id descending.',
  })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  getLibrary(@Req() req: RequestWithUser, @Query() query: QueryLibraryDto) {
    return this.meService.getLibrary(req.user.id, query);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiResponse({ status: 200, type: UserResponse })
  getMe(@Req() req: RequestWithUser) {
    return this.meService.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update the profile of the authenticated user' })
  @ApiResponse({ status: 200, type: UserResponse })
  updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    return this.meService.updateProfile(req.user.id, dto);
  }

  @Post('profile/avatar')
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
    return this.meService.updateAvatar(req.user.id, file);
  }
}
