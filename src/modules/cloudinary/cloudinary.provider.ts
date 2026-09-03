import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '../../configs/cloudinary.config';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
    });
    return cloudinary;
  },
};
