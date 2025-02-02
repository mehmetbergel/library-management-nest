import {
  IsInt,
  IsOptional,
  IsDecimal,
  IsNotEmpty,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateLoanDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsInt()
  @IsNotEmpty()
  bookId: number;

  @IsOptional()
  @IsDecimal()
  score?: number;
}

export class ReturnBookDto {
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(0)
  @Max(10)
  score: number;
}

export class UpdateLoanDto extends PartialType(CreateLoanDto) {}
