import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

import { WordSetService } from './word-set.service';
import { CreateUserWordSetDto } from './dto/create-user-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import { WordSetResponse } from './responses/word-set.response';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import { UpdateUserWordSetDto } from './dto/update-user-word-set.dto';

@ApiTags('Word Sets')
@ApiBearerAuth()
@Controller('word-sets')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class WordSetController {
  constructor(private readonly wordSetService: WordSetService) {}

  // Gom logic build actor về 1 chỗ, tránh lặp lại ở từng method bên dưới
  private actorOf(req: RequestWithUser) {
    return { type: ActorType.USER as const, userId: req.user.id };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get word set detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: WordSetResponse })
  findOne(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.wordSetService.findOne(id, this.actorOf(req));
  }

  @Post()
  @ApiOperation({ summary: 'Create your own word set' })
  @ApiBody({ type: CreateUserWordSetDto })
  @ApiResponse({ status: 201, type: WordSetResponse })
  create(@Req() req: RequestWithUser, @Body() dto: CreateUserWordSetDto) {
    return this.wordSetService.createOwn(req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update your own word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserWordSetDto })
  @ApiResponse({ status: 200, type: WordSetResponse })
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWordSetDto,
  ) {
    return this.wordSetService.updateOwn(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete your own word set' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.wordSetService.remove(id, this.actorOf(req));
  }
}
