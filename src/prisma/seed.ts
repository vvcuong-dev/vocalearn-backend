import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { databaseConfig } from '../configs/database.config';
import { PrismaClient } from '../generated/prisma/client';

const dbUrl = new URL(databaseConfig.url as string);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: dbUrl.port ? Number(dbUrl.port) : 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ''),
});
const prisma = new PrismaClient({ adapter });

const PERMISSIONS_SEED = [
  // USER
  { code: 'USER_LIST', name: 'Xem danh sách user', group: 'USER' },
  { code: 'USER_CREATE', name: 'Tạo user', group: 'USER' },
  { code: 'USER_UPDATE', name: 'Sửa user', group: 'USER' },
  { code: 'USER_DELETE', name: 'Xoá user', group: 'USER' },

  // CATEGORY
  { code: 'CATEGORY_LIST', name: 'Xem danh sách category', group: 'CATEGORY' },
  { code: 'CATEGORY_CREATE', name: 'Tạo category', group: 'CATEGORY' },
  { code: 'CATEGORY_UPDATE', name: 'Sửa category', group: 'CATEGORY' },
  { code: 'CATEGORY_DELETE', name: 'Xoá category', group: 'CATEGORY' },

  // LEARNING_PATH
  {
    code: 'LEARNING_PATH_LIST',
    name: 'Xem danh sách lộ trình học',
    group: 'LEARNING_PATH',
  },
  {
    code: 'LEARNING_PATH_CREATE',
    name: 'Tạo lộ trình học',
    group: 'LEARNING_PATH',
  },
  {
    code: 'LEARNING_PATH_UPDATE',
    name: 'Sửa lộ trình học',
    group: 'LEARNING_PATH',
  },
  {
    code: 'LEARNING_PATH_DELETE',
    name: 'Xoá lộ trình học',
    group: 'LEARNING_PATH',
  },

  // WORD
  { code: 'WORD_LIST', name: 'Xem từ vựng', group: 'WORD' },
  { code: 'WORD_CREATE', name: 'Thêm từ vựng', group: 'WORD' },
  { code: 'WORD_UPDATE', name: 'Sửa từ vựng', group: 'WORD' },
  { code: 'WORD_DELETE', name: 'Xóa từ vựng', group: 'WORD' },

  // WORD_SET
  { code: 'WORD_SET_LIST', name: 'Xem bộ từ', group: 'WORD_SET' },
  { code: 'WORD_SET_CREATE', name: 'Tạo bộ từ', group: 'WORD_SET' },
  { code: 'WORD_SET_UPDATE', name: 'Sửa bộ từ', group: 'WORD_SET' },
  { code: 'WORD_SET_DELETE', name: 'Xoá bộ từ', group: 'WORD_SET' },

  // FOLDER
  { code: 'FOLDER_LIST', name: 'Xem danh sách folder', group: 'FOLDER' },
  { code: 'FOLDER_UPDATE', name: 'Ẩn/hiện folder vi phạm', group: 'FOLDER' },

  // ROLE
  { code: 'ROLE_LIST', name: 'Xem danh sách role', group: 'ROLE' },
  { code: 'ROLE_CREATE', name: 'Tạo role', group: 'ROLE' },
  { code: 'ROLE_UPDATE', name: 'Sửa role', group: 'ROLE' },
  { code: 'ROLE_DELETE', name: 'Xoá role', group: 'ROLE' },
  { code: 'ROLE_ASSIGN_PERMISSION', name: 'Gán quyền cho role', group: 'ROLE' },
];

const ROLES_SEED = [
  {
    code: 'ADMIN',
    name: 'Quản trị viên',
    description: 'Full quyền hệ thống',
    isSystem: true,
    permissionCodes: '*' as const,
  },
  {
    code: 'USER_MANAGER',
    name: 'Quản lý người dùng',
    description: 'Quản lý tài khoản user',
    isSystem: false,
    permissionCodes: ['USER_LIST', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE'],
  },
];

async function seedPermissions() {
  for (const p of PERMISSIONS_SEED) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, isSystem: true },
    });
  }
  console.log(`Seeded ${PERMISSIONS_SEED.length} permissions.`);
}

async function seedRoles() {
  const allPermissions = await prisma.permission.findMany();

  for (const r of ROLES_SEED) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      },
    });

    const permissionsToAssign =
      r.permissionCodes === '*'
        ? allPermissions
        : allPermissions.filter((p) => r.permissionCodes.includes(p.code));

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissionsToAssign.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });

    console.log(
      `Seeded role "${r.code}" with ${permissionsToAssign.length} permission(s).`,
    );
  }
}

async function main() {
  await seedPermissions();
  await seedRoles();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
