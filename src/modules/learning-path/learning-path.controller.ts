import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActorGuard } from '../../common/guards/actor.guard';

import { LearningPathService } from './learning-path.service';

import { ActorType } from '../../constants/actor-type.constant';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { LearningPathResponse } from './response/learning-path.response';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LearningPathGroupedByCategoryResponse } from './response/learning-path-grouped-by-category.response';
@ApiTags('Learning Paths')
@ApiBearerAuth()
@Controller('learning-paths')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get('grouped-by-category')
  @ApiOperation({
    summary:
      'List learning paths grouped by category. Truyền categoryId để lọc riêng 1 category.',
  })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiResponse({ status: 200, type: [LearningPathGroupedByCategoryResponse] })
  findAllGroupedByCategory(@Query('categoryId') categoryId?: number) {
    return this.learningPathService.findAllGroupedByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get active learning path detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LearningPathResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.learningPathService.findOne(id, true);
  }
}
