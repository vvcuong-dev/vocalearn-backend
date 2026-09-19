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
import type { RequestWithUser } from '../../common/types/request-with-user.type';

@ApiTags('Words')
@ApiBearerAuth()
@Controller('words')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class WordController {
  constructor(private readonly wordService: WordService) {}

  @Get()
  @ApiOperation({ summary: 'List words in a word set' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Req() req: RequestWithUser, @Query() query: QueryWordDto) {
    return this.wordService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get word detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: WordResponse })
  findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.wordService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add words to your own word set' })
  @ApiBody({ type: CreateWordDto })
  @ApiResponse({ status: 201, type: [WordResponse] })
  create(@Req() req: RequestWithUser, @Body() dto: CreateWordDto) {
    return this.wordService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a word in your own word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWordDto })
  @ApiResponse({ status: 200, type: WordResponse })
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWordDto,
  ) {
    return this.wordService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a word from your own word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.wordService.remove(id, req.user.id);
  }
}
