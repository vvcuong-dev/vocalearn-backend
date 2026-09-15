import { Module } from '@nestjs/common';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { AdminFolderController } from './admin-folder.controller';
import { FolderRepository } from './repositories/folder.repository';
import { PermissionModule } from '../permission/permission.module';

@Module({
  controllers: [FolderController, AdminFolderController],
  providers: [FolderService, FolderRepository],
  exports: [FolderRepository],
  imports: [PermissionModule],
})
export class FolderModule {}
