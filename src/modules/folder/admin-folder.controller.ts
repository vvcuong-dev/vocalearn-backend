import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { FolderService } from './folder.service';
import { QueryFolderDto } from './dto/query-folder.dto';
import { FolderResponse } from './responses/folder.response';
import { PaginatedResponse } from '../../common/responses/paginated.response';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import { PERMISSIONS } from '../../constants/permission.constant';

const ADMIN_ACTOR = { type: ActorType.ADMIN as const };

@ApiTags('Admin - Folders')
@ApiBearerAuth()
@Controller('admin/folders')
@UseGuards(JwtAuthGuard, ActorGuard, PermissionsGuard)
@RequireActor(ActorType.ADMIN)
export class AdminFolderController {
  constructor(private readonly folderService: FolderService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.FOLDER.LIST])
  @ApiOperation({ summary: 'List all folders for moderation' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Query() query: QueryFolderDto) {
    return this.folderService.findAll(query, ADMIN_ACTOR);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.FOLDER.LIST])
  @ApiOperation({ summary: 'Get folder detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FolderResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.folderService.findOne(id, ADMIN_ACTOR);
  }

  @Patch(':id/hide')
  @RequirePermissions([PERMISSIONS.FOLDER.UPDATE])
  @ApiOperation({ summary: 'Hide a folder that violates policy' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FolderResponse })
  hide(@Param('id', ParseIntPipe) id: number) {
    return this.folderService.setHidden(id, true);
  }

  @Patch(':id/unhide')
  @RequirePermissions([PERMISSIONS.FOLDER.UPDATE])
  @ApiOperation({ summary: 'Unhide a folder' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FolderResponse })
  unhide(@Param('id', ParseIntPipe) id: number) {
    return this.folderService.setHidden(id, false);
  }
}
