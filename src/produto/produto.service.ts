import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompraProdutoDto } from './dto/compra-produto.dto';
import { VendaProdutoDto } from './dto/venda-produto.dto';
import { Operacao, Produto } from '@prisma/client';

@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) {}

  async buscarTodos(): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({ where: { status: true } });
    if (!produtos) throw new InternalServerErrorException('Não foi possível buscar os produtos.');
    return produtos;
  }

  async criar(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    return this.prisma.produto.create({ data: createProdutoDto });
  }

  async buscarPorId(id: number): Promise<Produto> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new BadRequestException('Produto não encontrado.');
    return produto;
  }

  async atualizar(id: number, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    return this.prisma.produto.update({ where: { id }, data: updateProdutoDto });
  }

  async desativar(id: number): Promise<Produto> {
    return this.prisma.produto.update({ where: { id }, data: { status: false } });
  }

  async comprarProdutos(id: number, compraProdutoDto: CompraProdutoDto): Promise<Operacao> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new BadRequestException('Produto não encontrado.');

    const novoPreco = compraProdutoDto.preco * 1.5; // margem de 50%
    const totalGasto = compraProdutoDto.quantidade * compraProdutoDto.preco;

    const operacao = await this.prisma.operacao.create({
      data: {
        tipo: 1,
        produtoId: id,
        quantidade: compraProdutoDto.quantidade,
        preco: compraProdutoDto.preco,
        total: totalGasto,
      },
    });

    await this.prisma.produto.update({
      where: { id },
      data: {
        precoCompra: novoPreco,
        precoVenda: Math.max(produto.precoVenda, novoPreco),
        quantidade: produto.quantidade + compraProdutoDto.quantidade,
      },
    });

    return operacao;
  }

  async venderProdutos(id: number, vendaProdutoDto: VendaProdutoDto): Promise<Operacao> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new BadRequestException('Produto não encontrado.');

    const totalRecebido = vendaProdutoDto.quantidade * vendaProdutoDto.preco;

    const operacao = await this.prisma.operacao.create({
      data: {
        tipo: 2,
        produtoId: id,
        quantidade: vendaProdutoDto.quantidade,
        preco: vendaProdutoDto.preco,
        total: totalRecebido,
      },
    });

    const novaQuantidade = produto.quantidade - vendaProdutoDto.quantidade;

    await this.prisma.produto.update({
      where: { id },
      data: {
        quantidade: novaQuantidade,
        precoVenda: novaQuantidade > 0 ? produto.precoVenda : 0,
        precoCompra: novaQuantidade > 0 ? produto.precoCompra : 0,
      },
    });

    return operacao;
  }
}
