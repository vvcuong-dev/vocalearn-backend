import { Module } from '@nestjs/common';
import { WordService } from './word.service';
import { WordController } from './word.controller';
import { AdminWordController } from './admin-word.controller';
import { WordRepository } from './repositories/word.repository';
import { WordSetModule } from '../word-set/word-set.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [WordSetModule, PermissionModule],
  controllers: [WordController, AdminWordController],
  providers: [WordService, WordRepository],
  exports: [WordRepository],
})
export class WordModule {}
