import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompraProdutoDto } from './dto/compra-produto.dto';
import { VendaProdutoDto } from './dto/venda-produto.dto';
import { Operacao, Produto } from '@prisma/client';
import {
  precoParaInteiro,
  inteiroParaPreco,
  calcularTotalCompra,
  verificarMargemLucro,
} from './utils/calculos.utils';

@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) {}

  async buscarTodos(): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({
      where: { status: true },
    });
    if (!produtos)
      throw new InternalServerErrorException(
        'Não foi possível buscar os produtos.',
      );
    return produtos;
  }

  async criar(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    try {
      const novoProduto = await this.prisma.produto.create({
        data: createProdutoDto,
      });
      return novoProduto;
    } catch (error) {
      throw new Error('Não foi possível criar este produto');
    }
  }

  async buscarPorId(id: number): Promise<Produto> {
    try {
      const produto = await this.prisma.produto.findUnique({
        where: { id },
      });
      return produto;
    } catch (error) {
      throw new Error('Produto não encontrado ou não cadastrado');
    }
  }

  async atualizar(
    id: number,
    updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    try {
      const updatedProduto = await this.prisma.produto.update({
        where: { id },
        data: updateProdutoDto,
      });
      return updatedProduto;
    } catch (error) {
      throw new Error('Produto não pode ser atualizado');
    }
  }

  async desativar(id: number): Promise<Produto> {
    try {
      const updatedProduto = await this.prisma.produto.update({
        where: { id },
        data: {
          status: false,
        },
      });
      return updatedProduto;
    } catch (error) {
      throw new Error('Produto não pode ser atualizado');
    }
  }

  async comprarProdutos(
    id: number,
    compraProdutoDto: CompraProdutoDto,
  ): Promise<Operacao> {
    const tipo = 1;

    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });
    if (!produto || !produto.status) {
      throw new BadRequestException('Produto indisponível ou não cadastrado');
    }

    if (compraProdutoDto.data && compraProdutoDto.data < new Date()) {
      throw new BadRequestException(
        'A data da compra não pode ser no passado.',
      );
    }

    if (!verificarMargemLucro(compraProdutoDto.preco, produto.precoVenda)) {
      throw new BadRequestException(
        'Valor de compra oferecido está abaixo do mercado, oferte um valor maior e tente novamente',
      );
    }

    await this.prisma.produto.update({
      where: { id },
      data: {
        quantidade: produto.quantidade + compraProdutoDto.quantidade,
      },
    });

    if (compraProdutoDto.preco > produto.precoVenda) {
      await this.prisma.produto.update({
        where: { id },
        data: {
          precoVenda: compraProdutoDto.preco,
        },
      });
    }

    try {
      const total = calcularTotalCompra(
        precoParaInteiro(compraProdutoDto.preco),
        compraProdutoDto.quantidade,
      );
      const totalComPrecoFormatado = inteiroParaPreco(total);

      const novaOperacao = await this.prisma.operacao.create({
        data: {
          data: compraProdutoDto.data,
          quantidade: compraProdutoDto.quantidade,
          preco: compraProdutoDto.preco,
          total: parseFloat(totalComPrecoFormatado),
          tipo: tipo,
          produto: { connect: { id: produto.id } },
        },
      });
      return novaOperacao;
    } catch (error) {
      throw new Error('Não foi possível efetuar a venda');
    }
  }

  async venderProdutos(
    id: number,
    vendaProduto: VendaProdutoDto,
  ): Promise<Operacao> {
    const tipo = 2;

    const produto = await this.prisma.produto.findUnique({
      where: { id },
    });
    if (!produto || !produto.status) {
      throw new BadRequestException('Produto indisponível ou não cadastrado');
    }

    if (produto.quantidade < vendaProduto.quantidade) {
      throw new BadRequestException(
        `Quantidade insuficiente de produtos, há apenas ${produto.quantidade} unidades deste produto em estoque`,
      );
    }

    await this.prisma.produto.update({
      where: { id },
      data: {
        quantidade: produto.quantidade - vendaProduto.quantidade,
      },
    });

    try {
      const total = calcularTotalCompra(
        precoParaInteiro(produto.precoVenda),
        vendaProduto.quantidade,
      );
      const totalComPrecoFormatado = inteiroParaPreco(total);
      const novaVenda = await this.prisma.operacao.create({
        data: {
          data: vendaProduto.data,
          quantidade: vendaProduto.quantidade,
          preco: produto.precoVenda,
          total: parseFloat(totalComPrecoFormatado),
          tipo: tipo,
          produto: { connect: { id: produto.id } },
        },
      });

      if (produto.quantidade === 0) {
        await this.prisma.produto.update({
          where: { id },
          data: {
            precoCompra: 0,
            precoVenda: 0,
          },
        });
      }

      return novaVenda;
    } catch (error) {
      throw new Error('Método não implementado.');
    }
  }
}
