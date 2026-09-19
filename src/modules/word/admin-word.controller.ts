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
import { WordService } from './word.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { QueryWordDto } from './dto/query-word.dto';
import { WordResponse } from './response/word.response';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../constants/permission.constant';

@ApiTags('Admin - Words')
@ApiBearerAuth()
@Controller('admin/words')
@UseGuards(JwtAuthGuard, ActorGuard, PermissionsGuard)
@RequireActor(ActorType.ADMIN)
export class AdminWordController {
  constructor(private readonly wordService: WordService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.WORD.LIST])
  @ApiOperation({ summary: 'List words in a word set' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Query() query: QueryWordDto) {
    return this.wordService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.WORD.LIST])
  @ApiOperation({ summary: 'Get word detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: WordResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wordService.findOne(id);
  }

  @Post()
  @RequirePermissions([PERMISSIONS.WORD.CREATE])
  @ApiOperation({ summary: 'Add words to an official word set' })
  @ApiBody({ type: CreateWordDto })
  @ApiResponse({ status: 201, type: [WordResponse] })
  create(@Body() dto: CreateWordDto) {
    return this.wordService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.WORD.UPDATE])
  @ApiOperation({ summary: 'Update a word in an official word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWordDto })
  @ApiResponse({ status: 200, type: WordResponse })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWordDto) {
    return this.wordService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.WORD.DELETE])
  @ApiOperation({ summary: 'Soft delete a word from an official word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.wordService.remove(id);
  }
}
