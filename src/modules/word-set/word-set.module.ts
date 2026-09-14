import { Module } from '@nestjs/common';
import { WordSetService } from './word-set.service';
import { WordSetController } from './word-set.controller';
import { AdminWordSetController } from './admin-word-set.controller';
import { WordSetRepository } from './repositories/word-set.repository';
import { LearningPathModule } from '../learning-path/learning-path.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  controllers: [WordSetController, AdminWordSetController],
  imports: [LearningPathModule, PermissionModule],
  providers: [WordSetService, WordSetRepository],
  exports: [WordSetService, WordSetRepository],
})
export class WordSetModule {}
