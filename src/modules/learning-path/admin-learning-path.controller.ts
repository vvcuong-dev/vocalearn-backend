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

import { LearningPathService } from './learning-path.service';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { QueryLearningPathDto } from './dto/query-learning-path.dto';
import { PaginatedResponse } from '../../common/responses/paginated.response';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import { PERMISSIONS } from '../../constants/permission.constant';
import { LearningPathResponse } from './response/learning-path.response';

@ApiTags('Admin - Learning Paths')
@ApiBearerAuth()
@Controller('admin/learning-paths')
@UseGuards(JwtAuthGuard, ActorGuard, PermissionsGuard)
@RequireActor(ActorType.ADMIN)
export class AdminLearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.LEARNING_PATH.LIST])
  @ApiOperation({ summary: 'List learning paths with filters' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Query() query: QueryLearningPathDto) {
    return this.learningPathService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.LEARNING_PATH.LIST])
  @ApiOperation({ summary: 'Get learning path detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: LearningPathResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.learningPathService.findOne(id);
  }

  @Post()
  @RequirePermissions([PERMISSIONS.LEARNING_PATH.CREATE])
  @ApiOperation({ summary: 'Create a learning path' })
  @ApiBody({ type: CreateLearningPathDto })
  @ApiResponse({ status: 201, type: LearningPathResponse })
  create(@Body() dto: CreateLearningPathDto) {
    return this.learningPathService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.LEARNING_PATH.UPDATE])
  @ApiOperation({ summary: 'Update a learning path' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateLearningPathDto })
  @ApiResponse({ status: 200, type: LearningPathResponse })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLearningPathDto,
  ) {
    return this.learningPathService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.LEARNING_PATH.DELETE])
  @ApiOperation({ summary: 'Soft delete a learning path' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.learningPathService.remove(id);
  }
}
