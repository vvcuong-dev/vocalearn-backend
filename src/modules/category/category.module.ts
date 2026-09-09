import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './repositories/category.repository';
import { PermissionModule } from '../permission/permission.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  imports: [PermissionModule],
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
