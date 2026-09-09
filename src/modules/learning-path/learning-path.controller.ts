import { Controller } from '@nestjs/common';
import { LearningPathService } from './learning-path.service';

@Controller('learning-path')
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}
}
