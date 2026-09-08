import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ActorGuard } from '../../common/guards/actor.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequireActor } from '../../common/decorators/actor.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ActorType } from '../../constants/actor-type.constant';
import { PERMISSIONS } from '../../constants/permission.constant';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { CategoryResponse } from './responses/category.response';
import { PaginatedResponse } from '../../common/responses/paginated.response';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, ActorGuard, PermissionsGuard)
@RequireActor(ActorType.ADMIN)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @RequirePermissions([PERMISSIONS.CATEGORY.LIST])
  @ApiOperation({ summary: 'List categories with filters' })
  @ApiResponse({ status: 200, type: PaginatedResponse })
  findAll(@Query() query: QueryCategoryDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions([PERMISSIONS.CATEGORY.LIST])
  @ApiOperation({ summary: 'Get category detail by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: CategoryResponse })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @RequirePermissions([PERMISSIONS.CATEGORY.CREATE])
  @ApiOperation({ summary: 'Create a category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, type: CategoryResponse })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions([PERMISSIONS.CATEGORY.UPDATE])
  @ApiOperation({ summary: 'Update a category' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, type: CategoryResponse })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions([PERMISSIONS.CATEGORY.DELETE])
  @ApiOperation({ summary: 'Soft delete a category' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, schema: { type: 'boolean' } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
