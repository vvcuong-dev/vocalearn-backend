import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DictionaryEntryResponse } from './responses/dictionary-entry.response';

@Injectable()
export class DictionaryService {
  constructor(private readonly prisma: PrismaService) {}

  async suggest(query: string): Promise<DictionaryEntryResponse[]> {
    const prefix = query.trim();
    if (!prefix) return [];
    // Escape SQL LIKE metacharacters so suggestions use a literal prefix.
    const escaped = prefix.replace(/[\\%_]/g, '\\$&');
    const entries = await this.prisma.dictionaryEntry.findMany({
      where: { term: { startsWith: escaped } },
      orderBy: { term: 'asc' },
      take: 20,
    });
    return entries.map((entry) => new DictionaryEntryResponse(entry));
  }
}
