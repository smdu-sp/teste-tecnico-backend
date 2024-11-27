import { IsInt, IsPositive, IsOptional, IsDateString } from 'class-validator';

export class VendaProdutoDto {
  @IsInt({ message: 'A quantidade deve ser um número inteiro.' })
  @IsPositive({ message: 'A quantidade deve ser um número positivo.' })
  quantidade: number;

  @IsOptional()
  @IsDateString({}, { message: 'A data deve ser uma string de data válida' })
  data?: Date;
}
