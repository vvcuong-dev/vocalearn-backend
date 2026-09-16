import { ApiProperty } from '@nestjs/swagger';
import { FolderResponse } from '../../folder/responses/folder.response';
import { WordSetResponse } from '../../word-set/responses/word-set.response';

export class LibraryResponse {
  @ApiProperty({ enum: ['folder', 'word-set'] })
  type: 'folder' | 'word-set';

  @ApiProperty({
    type: Object,
    description:
      'FolderResponse khi type là folder, WordSetResponse khi type là word-set',
  })
  data: FolderResponse | WordSetResponse;

  constructor(
    type: 'folder' | 'word-set',
    data: FolderResponse | WordSetResponse,
  ) {
    this.type = type;
    this.data = data;
  }
}
