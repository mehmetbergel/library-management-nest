import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(250)
  name: string;
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}
