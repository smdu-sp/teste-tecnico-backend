import { PartialType } from '@nestjs/mapped-types';
import { CreateProdutoDto } from './create-produto.dto';
import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {
  @IsOptional()
  @IsNumber({}, { message: 'O preço de compra deve ser um número.' })
  @Min(0, { message: 'O preço de compra não pode ser negativo.' })
  precoCompra?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O preço de venda deve ser um número.' })
  @Min(0, { message: 'O preço de venda não pode ser negativo.' })
  precoVenda?: number;

  @IsOptional()
  @IsBoolean({ message: 'O status deve ser um valor booleano.' })
  status?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'A quantidade deve ser um número.' })
  @Min(0, { message: 'A quantidade não pode ser negativa.' })
  quantidade?: number;
}
