import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  BadRequestException,
  ValidationError,
  HttpStatus,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { appConfig } from './configs/app.config';
import { VOCALEARN_ERROR_CODES } from './constants/error-code.constant';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: appConfig.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('VocaLearn API')
    .setDescription('API documentation for the VocaLearn backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => ({
          field: error.property,
          errorCode: Object.values(error.constraints || {})[0],
        }));

        return new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: VOCALEARN_ERROR_CODES.COMMON.VALIDATION_ERROR,
          message: VOCALEARN_ERROR_CODES.COMMON.VALIDATION_ERROR,
          errors,
        });
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(appConfig.port);
}
void bootstrap();
