import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { ImageUploadLimit } from '../common/types/upload.type';
import { MB_TO_BYTES } from '../constants/upload.constant';
import { VOCALEARN_ERROR_CODES } from '../constants/error-code.constant';
import { AppException } from '../common/exceptions/app.exception';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

export function createImageUploadOptions(
  limit: ImageUploadLimit,
): MulterOptions {
  return {
    limits: { fileSize: limit.maxSize * MB_TO_BYTES },
    fileFilter: (req, file, callback) => {
      if (!limit.allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new AppException(
            VOCALEARN_ERROR_CODES.UPLOAD.INVALID_FILE_TYPE,
            HttpStatus.BAD_REQUEST,
          ),
          false,
        );
      }
      callback(null, true);
    },
  };
}
