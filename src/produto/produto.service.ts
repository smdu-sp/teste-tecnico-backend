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

@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) {}

  async buscarTodos(): Promise<Produto[]> {
    //método que retorna todos os produtos com status ativo (true)
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
    //método que cria um novo produto, retornando o produto criado
    try {
      const novoProduto = await this.prisma.produto.create({
        data: {
          ...createProdutoDto,
          status: true, //produto ativo por padrão
        },
      });
      return novoProduto;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar produto');
    }
  }

  async buscarPorId(id: number): Promise<Produto> {
    // método para retornar o produto do id informado, com os respectivos dados de operações
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: {
        operacoes: true,
      },
    });
    if (!produto) {
      throw new BadRequestException('Produto não encontrado.');
    }
    return produto;
  }

  async atualizar(
    id: number,
    updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    //desenvolver método para atualizar os dados do produto do id informado, retornando o produto atualizado
    try {
      const produtoAtualizado = await this.prisma.produto.update({
        where: { id },
        data: { ...updateProdutoDto },
      });
      return produtoAtualizado;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao atualizar produto.');
    }
  }

  async desativar(id: number): Promise<Produto> {
    //desenvolver método para desativar o produto, mudar o status para false
    throw new Error('Método não implementado.');
  }

  async comprarProdutos(
    id: number,
    compraProdutoDto: CompraProdutoDto,
  ): Promise<Operacao> {
    const tipo = 1;
    //desenvolver método que executa a operação de compra, retornando a operação com os respectivos dados do produto
    //tipo: 1 - compra, 2 - venda
    //o preço de venda do produto deve ser calculado a partir do preço inserido na operacao, com uma margem de 50% de lucro
    //caso o novo preço seja maior que o preço de venda atual, o preço de venda deve ser atualizado, assim como o preço de compra
    //calcular o valor total gasto na compra (quantidade * preco)
    //deve também atualizar a quantidade do produto, somando a quantidade comprada
    throw new Error('Método não implementado.');
  }

  async venderProdutos(
    id: number,
    vendaProduto: VendaProdutoDto,
  ): Promise<Operacao> {
    const tipo = 2;
    //desenvolver método que executa a operação de venda, retornando a venda com os respectivos dados do produto
    //tipo: 1 - compra, 2 - venda
    //calcular o valor total recebido na venda (quantidade * preco)
    //deve também atualizar a quantidade do produto, subtraindo a quantidade vendida
    //caso a quantidade seja esgotada, ou seja, chegue a 0, você deverá atualizar os precoVenda e precoCompra para 0
    throw new Error('Método não implementado.');
  }
}
