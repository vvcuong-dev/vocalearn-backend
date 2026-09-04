import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminProfileController } from './admin-profile.controller';
import { AdminRepository } from './repositories/admin.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [AdminProfileController],
  providers: [AdminService, AdminRepository],
  exports: [AdminRepository],
})
export class AdminModule {}
