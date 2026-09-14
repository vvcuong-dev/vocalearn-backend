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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { WordSetService } from './word-set.service';
import { QueryWordSetDto } from './dto/query-word-set.dto';
import { CreateAdminWordSetDto } from './dto/create-admin-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import { WordSetResponse } from './responses/word-set.response';

import { PaginatedResponse } from '../../common/responses/paginated.response';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import { PERMISSIONS } from '../../constants/permission.constant';

const ADMIN_ACTOR = { type: ActorType.ADMIN as const };

@ApiTags('Admin - Word Sets')
@ApiBearerAuth()
@Controller('admin/word-sets')
@UseGuards(JwtAuthGuard, ActorGuard, PermissionsGuard)
@RequireActor(ActorType.ADMIN)
export class AdminWordSetController {
  constructor(private readonly wordSetService: WordSetService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.WORD_SET.LIST])
  @ApiOperation({ summary: 'List word sets with filters' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Query() query: QueryWordSetDto) {
    return this.wordSetService.findAll(query, ADMIN_ACTOR);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.WORD_SET.LIST])
  @ApiOperation({ summary: 'Get word set detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: WordSetResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wordSetService.findOne(id, ADMIN_ACTOR);
  }

  @Post()
  @RequirePermissions([PERMISSIONS.WORD_SET.CREATE])
  @ApiOperation({ summary: 'Create an official word set' })
  @ApiBody({ type: CreateAdminWordSetDto })
  @ApiResponse({ status: 201, type: WordSetResponse })
  create(@Body() dto: CreateAdminWordSetDto) {
    return this.wordSetService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.WORD_SET.UPDATE])
  @ApiOperation({ summary: 'Update an official word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWordSetDto })
  @ApiResponse({ status: 200, type: WordSetResponse })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWordSetDto) {
    return this.wordSetService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.WORD_SET.DELETE])
  @ApiOperation({ summary: 'Soft delete a word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.wordSetService.remove(id, ADMIN_ACTOR);
  }
}
