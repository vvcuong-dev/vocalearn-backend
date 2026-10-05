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
  @ApiProperty({ type: String, nullable: true }) audioUrl!: string | null;
  @ApiProperty({ type: String, nullable: true }) audioSourceUrl!: string | null;

  constructor(
    entry: DictionaryEntry,
    pronunciation?: {
      phonetic: string | null;
      audioUrl: string;
      audioSourceUrl: string;
    },
  ) {
    this.id = entry.id;
    this.term = entry.term;
    this.phonetic = entry.phonetic || pronunciation?.phonetic || null;
    this.audioUrl = pronunciation?.audioUrl || null;
    this.audioSourceUrl = pronunciation?.audioSourceUrl || null;
    this.partOfSpeech = entry.partOfSpeech;
    this.meaning = entry.meaning;
    this.example = entry.example;
  }
}
