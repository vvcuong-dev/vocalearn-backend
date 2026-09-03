import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as CloudinaryType,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import { AppException } from '../../common/exceptions/app.exception';
import { VOCALEARN_ERROR_CODES } from '../../constants/error-code.constant';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinary: typeof CloudinaryType,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { folder },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            return reject(
              new AppException(
                VOCALEARN_ERROR_CODES.UPLOAD.UPLOAD_FAILED,
                HttpStatus.BAD_GATEWAY,
              ),
            );
          }

          resolve(result); // result là đối tượng phản hồi từ Cloudinary chứa thông tin về tệp đã tải lên, bao gồm URL, kích thước, định dạng, v.v.
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream); // đoạn này tạo một luồng đọc từ bộ đệm của tệp và truyền nó vào luồng tải lên của Cloudinary.
    });
  }

  async uploadImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadApiResponse[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId);
  }
}
