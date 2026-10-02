import { ApiProperty } from '@nestjs/swagger';
import { DictionaryEntry, WordType } from '../../../generated/prisma/client';

export class DictionaryEntryResponse {
  @ApiProperty() id!: number;
  @ApiProperty() term!: string;
  @ApiProperty({ type: String, nullable: true }) phonetic!: string | null;
  @ApiProperty({ enum: WordType, nullable: true })
  partOfSpeech!: WordType | null;
  @ApiProperty({ type: String, nullable: true }) meaning!: string | null;
  @ApiProperty({ type: String, nullable: true }) example!: string | null;

  constructor(entry: DictionaryEntry) {
    this.id = entry.id;
    this.term = entry.term;
    this.phonetic = entry.phonetic as string | null;
    this.partOfSpeech = entry.partOfSpeech as WordType | null;
    this.meaning = entry.meaning as string | null;
    this.example = entry.example as string | null;
  }
}
