import { Module } from '@nestjs/common';
import { LearningPathService } from './learning-path.service';
import { LearningPathController } from './learning-path.controller';
import { LearningPathRepository } from './repositories/learning-path.repository';
import { CategoryModule } from '../category/category.module';
import { AdminLearningPathController } from './admin-learning-path.controller';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [CategoryModule, PermissionModule],
  controllers: [LearningPathController, AdminLearningPathController],
  providers: [LearningPathService, LearningPathRepository],
  exports: [LearningPathRepository],
})
export class LearningPathModule {}
