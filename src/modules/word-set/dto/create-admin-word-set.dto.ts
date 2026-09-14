import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAdminWordSetDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number = 1;

  @IsOptional()
  @IsBoolean()
  isPro?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @IsNotEmpty()
  @IsInt()
  learningPathId!: number;
}
