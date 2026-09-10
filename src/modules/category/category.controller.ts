import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ActorGuard } from '../../common/guards/actor.guard';
import { CategoryService } from './category.service';
import { ActorType } from '../../constants/actor-type.constant';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CategorySummaryResponse } from './responses/category-summary.response';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, ActorGuard)
@RequireActor(ActorType.USER)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    type: [CategorySummaryResponse],
  })
  findAll() {
    return this.categoryService.findAllSummary();
  }
}
