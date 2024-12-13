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

    // Busca todos os produtos ativos
  async buscarTodos(): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({ where: { status: true } });
    if (!produtos) throw new InternalServerErrorException('Não foi possível buscar os produtos.');
    return produtos;
  }

    // Cria um novo produto
  async criar(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    return this.prisma.produto.create({ data: createProdutoDto });
  }

    // Busca um produto pelo ID
  async buscarPorId(id: number): Promise<Produto> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new BadRequestException('Produto não encontrado.');
    return produto;
  }

    // Atualiza um produto existente
  async atualizar(id: number, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    return this.prisma.produto.update({ where: { id }, data: updateProdutoDto });
  }

  // Desativa um produto(O deixa inativo)
  async desativar(id: number): Promise<Produto> {
    return this.prisma.produto.update({ where: { id }, data: { status: false } });
  }

    // Registra uma compra de produtos e atualiza o estoque e preços
  async comprarProdutos(id: number, compraProdutoDto: CompraProdutoDto): Promise<Operacao> {
        // Busca o produto a ser comprado
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new BadRequestException('Produto não encontrado.');

        // Calcula o novo preço de compra com margem de 50%
    const novoPreco = compraProdutoDto.preco * 1.5; // margem de 50%
        // Calcula o valor total da compra
    const totalGasto = compraProdutoDto.quantidade * compraProdutoDto.preco;

        // Registra a operação de compra
    const operacao = await this.prisma.operacao.create({
      data: {
        tipo: 1, // 1 indicação de uma compra
        produtoId: id,
        quantidade: compraProdutoDto.quantidade,
        preco: compraProdutoDto.preco,
        total: totalGasto,
      },
    });

        // Atualiza o produto com os novos valores
    await this.prisma.produto.update({
      where: { id },
      data: {
        precoCompra: novoPreco,
        precoVenda: Math.max(produto.precoVenda, novoPreco),
        quantidade: produto.quantidade + compraProdutoDto.quantidade,
      },
    });

    // Retorna o objeto da operação feita
    return operacao;
  }

    // Registra uma venda de produtos e atualiza o estoque e preços
  async venderProdutos(id: number, vendaProdutoDto: VendaProdutoDto): Promise<Operacao> {
        // Calcula o valor total da venda
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new BadRequestException('Produto não encontrado.');

        // Calcula o valor total da venda
    const totalRecebido = vendaProdutoDto.quantidade * vendaProdutoDto.preco;

        // Registra a operação de venda
    const operacao = await this.prisma.operacao.create({
      data: {
        tipo: 2,
        produtoId: id,
        quantidade: vendaProdutoDto.quantidade,
        preco: vendaProdutoDto.preco,
        total: totalRecebido,
      },
    });

        // Atualiza o produto com os novos valores
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
