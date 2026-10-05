import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DictionaryEntryResponse } from './responses/dictionary-entry.response';
import { dictionaryConfig } from '../../configs/dictionary.config';

@Injectable()
export class DictionaryService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(query: string): Promise<DictionaryEntryResponse | null> {
    const term = query.trim();
    if (!term) return null;
    const entry = await this.prisma.dictionaryEntry.findUnique({
      where: { term },
    });
    return entry
      ? new DictionaryEntryResponse(
          entry,
          Object.hasOwn(dictionaryConfig.pronunciations, entry.term)
            ? dictionaryConfig.pronunciations[entry.term]
            : undefined,
        )
      : null;
  }

  async suggest(query: string): Promise<DictionaryEntryResponse[]> {
    const prefix = query.trim();
    if (!prefix) return [];
    // Escape SQL LIKE metacharacters so suggestions use a literal prefix.
    const escaped = prefix.replace(/[\\%_]/g, '\\$&');
    const entries = await this.prisma.dictionaryEntry.findMany({
      where: {
        term: { startsWith: escaped },
        ...(!/\s/.test(prefix) ? { NOT: { term: { contains: ' ' } } } : {}),
      },
      orderBy: { term: 'asc' },
      take: dictionaryConfig.suggestionLimit,
    });
    return entries.map((entry) => new DictionaryEntryResponse(entry));
  }
}
