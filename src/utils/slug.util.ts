import slugify from 'slugify';

export function toSlug(text: string): string {
  return slugify(text, {
    lower: true, // chuyển về chữ thường
    strict: true, // xoá ký tự không phải chữ/số (dấu câu, ký tự đặc biệt...)
    trim: true, // trim khoảng trắng đầu/cuối
    locale: 'vi', // hỗ trợ transliterate tiếng Việt tốt hơn (bỏ dấu)
  });
}

export async function generateUniqueSlug(
  checkExists: (slug: string) => Promise<boolean>,
  name: string,
): Promise<string> {
  const base = toSlug(name);
  let slug = base;
  let suffix = 1;

  while (await checkExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix++;
  }

  return slug;
}
