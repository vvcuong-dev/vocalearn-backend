import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryRepository } from './repositories/category.repository';
import { PermissionModule } from '../permission/permission.module';
import { CategoryController } from './category.controller';
import { CategoryAdminController } from './admin-category.controller';

@Module({
  controllers: [CategoryAdminController, CategoryController],
  providers: [CategoryService, CategoryRepository],
  imports: [PermissionModule],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
