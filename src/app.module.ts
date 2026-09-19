import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './common/validators/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { TokenModule } from './modules/token/token.module';
import { RedisModule } from './modules/redis/redis.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { MailModule } from './modules/mail/mail.module';
import { redisConfig } from './configs/redis.config';
import { BullModule } from '@nestjs/bullmq';
import { AdminModule } from './modules/admin/admin.module';
import { CategoryModule } from './modules/category/category.module';
import { LearningPathModule } from './modules/learning-path/learning-path.module';
import { WordSetModule } from './modules/word-set/word-set.module';
import { FolderModule } from './modules/folder/folder.module';
import { MeModule } from './modules/me/me.module';
import { WordModule } from './modules/word/word.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BullModule.forRoot({
      connection: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    TokenModule,
    RedisModule,
    CloudinaryModule,
    PermissionModule,
    RoleModule,
    MailModule,
    AdminModule,
    CategoryModule,
    LearningPathModule,
    WordSetModule,
    FolderModule,
    MeModule,
    WordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
