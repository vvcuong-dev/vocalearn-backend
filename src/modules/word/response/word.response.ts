import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Word, WordType } from '../../../generated/prisma/client';

export class WordResponse {
  @ApiProperty() id: number;
  @ApiProperty() term: string;
  @ApiProperty() slug: string;
  @ApiProperty() meaning: string;
  @ApiPropertyOptional({ type: String, nullable: true }) phonetic:
    string | null;
  @ApiPropertyOptional({ enum: WordType, nullable: true })
  partOfSpeech: WordType | null;
  @ApiPropertyOptional({ type: String, nullable: true }) example: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) audioUrl:
    string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) note: string | null;
  @ApiProperty() wordSetId: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  constructor(word: Word) {
    this.id = word.id;
    this.term = word.term;
    this.slug = word.slug;
    this.meaning = word.meaning;
    this.phonetic = word.phonetic;
    this.partOfSpeech = word.partOfSpeech;
    this.example = word.example;
    this.audioUrl = word.audioUrl;
    this.note = word.note;
    this.wordSetId = word.wordSetId;
    this.createdAt = word.createdAt;
    this.updatedAt = word.updatedAt;
  }
}
