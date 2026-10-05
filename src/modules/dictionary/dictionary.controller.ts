import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DictionaryService } from './dictionary.service';
import { QueryDictionaryDto } from './dto/query-dictionary.dto';
import { DictionaryEntryResponse } from './responses/dictionary-entry.response';

@ApiTags('Dictionary')
@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('lookup')
  @ApiOperation({
    summary: 'Look up an exact term for independent field suggestions',
  })
  @ApiResponse({ status: 200, type: DictionaryEntryResponse })
  lookup(@Query() query: QueryDictionaryDto) {
    return this.dictionaryService.lookup(query.q);
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Suggest dictionary entries by prefix' })
  @ApiResponse({ status: 200, type: [DictionaryEntryResponse] })
  suggest(@Query() query: QueryDictionaryDto) {
    return this.dictionaryService.suggest(query.q);
  }
}
