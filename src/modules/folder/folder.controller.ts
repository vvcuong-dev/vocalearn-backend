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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { FolderService } from './folder.service';
import { QueryFolderDto } from './dto/query-folder.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { UpdateFolderVisibilityDto } from './dto/update-folder-visibility.dto';
import { FolderResponse } from './responses/folder.response';
import { PaginatedResponse } from '../../common/responses/paginated.response';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import type { RequestWithUser } from '../../common/types/request-with-user.type';

@ApiTags('Folders')
@ApiBearerAuth()
@Controller('folders')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  private actorOf(req: RequestWithUser) {
    return { type: ActorType.USER as const, userId: req.user.id };
  }

  @Get()
  @ApiOperation({ summary: 'List your folders and public folders' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Req() req: RequestWithUser, @Query() query: QueryFolderDto) {
    return this.folderService.findAll(query, this.actorOf(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FolderResponse })
  findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.folderService.findOne(id, this.actorOf(req));
  }

  @Post()
  @ApiOperation({ summary: 'Create your own folder' })
  @ApiBody({ type: CreateFolderDto })
  @ApiResponse({ status: 201, type: FolderResponse })
  create(@Req() req: RequestWithUser, @Body() dto: CreateFolderDto) {
    return this.folderService.create(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update your own folder name' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateFolderDto })
  @ApiResponse({ status: 200, type: FolderResponse })
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folderService.update(req.user.id, id, dto);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Toggle public visibility of your folder' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateFolderVisibilityDto })
  @ApiResponse({ status: 200, type: FolderResponse })
  updateVisibility(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderVisibilityDto,
  ) {
    return this.folderService.updateVisibility(req.user.id, id, dto.isPublic);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete your own folder' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.folderService.remove(req.user.id, id);
  }
}
