import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';
import { AppException } from '../../common/exceptions/app.exception';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDERS } from '../../constants/cloudinary.constant';
import { AdminRepository } from './repositories/admin.repository';
import { AdminResponse } from './responses/admin.response';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getProfile(adminId: number): Promise<AdminResponse> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.USER.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return new AdminResponse(admin);
  }

  async updateProfile(
    adminId: number,
    dto: UpdateAdminProfileDto,
  ): Promise<AdminResponse> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ADMIN.ADMIN_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    const updated = await this.adminRepository.update(adminId, dto);
    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ADMIN.ADMIN_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }
    return new AdminResponse(updated);
  }

  async updateAvatar(
    adminId: number,
    file: Express.Multer.File,
  ): Promise<AdminResponse> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ADMIN.ADMIN_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    const uploaded = await this.cloudinaryService.uploadImage(
      file,
      CLOUDINARY_FOLDERS.AVATARS,
    );
    const updated = await this.adminRepository.update(adminId, {
      avatar: uploaded.secure_url,
      avatarPublicId: uploaded.public_id,
    });

    if (admin.avatarPublicId) {
      await this.cloudinaryService
        .deleteImage(admin.avatarPublicId)
        .catch((error: Error) => {
          this.logger.error(`Failed to delete old avatar: ${error.message}`);
        });
    }

    if (!updated) {
      throw new AppException(
        VOCALEARN_ERROR_CODES.ADMIN.ADMIN_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    return new AdminResponse(updated);
  }
}
