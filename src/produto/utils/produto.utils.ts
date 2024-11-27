import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Produto } from '@prisma/client';

@Injectable()
export class ProdutoUtils {
  constructor(private readonly prisma: PrismaService) {}

  async validarProduto(id: number): Promise<Produto> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });

    if (!produto || !produto.status) {
      throw new BadRequestException('Produto indisponível ou não cadastrado');
    }

    return produto;
  }

  validarData(data: string | Date): Date {
    const dataConvertida = data instanceof Date ? data : new Date(data);
    
    if (isNaN(dataConvertida.getTime()) || dataConvertida < new Date()) {
      throw new BadRequestException(
        'A data informada não pode ser no passado ou é inválida.',
      );
    }
    return dataConvertida;
  }
  
}
