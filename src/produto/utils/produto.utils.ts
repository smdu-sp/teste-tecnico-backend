import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Produto } from '@prisma/client';
import { ERROR_MESSAGES } from '../constants/error-messages';

@Injectable()
export class ProdutoUtils {
  constructor(private readonly prisma: PrismaService) {}

  async validarProduto(id: number): Promise<Produto> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });

    if (!produto || !produto.status) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }

    return produto;
  }

  validarData(data: string | Date): Date {
    const dataConvertida = data instanceof Date ? data : new Date(data);

    if (isNaN(dataConvertida.getTime()) || dataConvertida < new Date()) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_DATE);
    }
    return dataConvertida;
  }
}
