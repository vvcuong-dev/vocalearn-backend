import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { FolderModule } from '../folder/folder.module';
import { WordSetModule } from '../word-set/word-set.module';

@Module({
  imports: [UserModule, FolderModule, WordSetModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
