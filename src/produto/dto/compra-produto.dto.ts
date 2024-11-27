import {
  IsInt,
  IsOptional,
  IsPositive,
  IsDateString,
  IsNumber,
  isDateString,
} from 'class-validator';

export class CompraProdutoDto {
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'A quantidade deve ser um número positivo.' })
  quantidade: number;

  @IsNumber({}, { message: 'O preço deve ser um número válido.' })
  @IsPositive({ message: 'O preço deve ser um número positivo.' })
  preco: number;

  @IsOptional()
  @IsDateString({}, { message: 'A data deve ser uma string de data válida' })
  data?: Date;
}
