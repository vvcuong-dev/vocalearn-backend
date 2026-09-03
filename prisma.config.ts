import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { databaseConfig } from './src/configs/database.config';

export default defineConfig({
  schema: 'src/prisma',
  migrations: {
    path: 'src/prisma/migrations',
    seed: 'src/prisma/seed.ts',
  },
  datasource: {
    url: databaseConfig.url,
  },
});
