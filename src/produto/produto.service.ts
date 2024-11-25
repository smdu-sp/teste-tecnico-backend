import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompraProdutoDto } from './dto/compra-produto.dto';
import { VendaProdutoDto } from './dto/venda-produto.dto';
import { Operacao, Produto } from '@prisma/client';

@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) { }

  async buscarTodos(): Promise<Produto[]> {
    //método que retorna todos os produtos com status ativo (true)
    const produtos = await this.prisma.produto.findMany({ where: { status: true } });
    if (!produtos) throw new InternalServerErrorException('Não foi possível buscar os produtos.');
    return produtos;
  }

  async criar(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    //desenvolver método que cria um novo produto, retornando o produto criado
    const { nome, descricao } = createProdutoDto;


    if (!nome || nome.trim() === '') {
      throw new BadRequestException('O nome do produto é obrigatório.');
    }


    const produtoExistente = await this.prisma.produto.findUnique({
      where: { nome },
    });

    if (produtoExistente) {
      throw new BadRequestException(`Já existe um produto cadastrado com o nome "${nome}".`);
    }


    const produto = await this.prisma.produto.create({
      data: {
        nome,
        descricao,
        quantidade: 0,
        precoCompra: 0,
        precoVenda: 0,
        status: true,
      }

    })

    return produto
  }

  async buscarPorId(id: number): Promise<Produto> {
    //desenvolver método para retornar o produto do id informado, com os respectivos dados de operações

    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: { operacoes: true },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
    return produto;
  }

  async atualizar(id: number, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    //desenvolver método para atualizar os dados do produto do id informado, retornando o produto atualizado
    await this.buscarPorId(id);

    const produtoAtualizado = await this.prisma.produto.update({
      where: { id },
      data: updateProdutoDto,
    });
    return produtoAtualizado;
  }

  async desativar(id: number): Promise<Produto> {
    //desenvolver método para desativar o produto, mudar o status para false

    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new NotFoundException('Produto não encontrado.');

    return this.prisma.produto.update({
      where: { id },
      data: { status: false },
    })
  }

  async comprarProdutos(id: number, compraProdutoDto: CompraProdutoDto): Promise<Operacao> {
    const tipo = 1;
    //desenvolver método que executa a operação de compra, retornando a operação com os respectivos dados do produto
    //tipo: 1 - compra, 2 - venda
    //o preço de venda do produto deve ser calculado a partir do preço inserido na operacao, com uma margem de 50% de lucro
    //caso o novo preço seja maior que o preço de venda atual, o preço de venda deve ser atualizado, assim como o preço de compra
    //calcular o valor total gasto na compra (quantidade * preco)
    //deve também atualizar a quantidade do produto, somando a quantidade comprada

    const { quantidade, preco } = compraProdutoDto;


    if (quantidade <= 0 || preco <= 0) {
      throw new BadRequestException('Quantidade e preço devem ser maiores que zero.');
    }

    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new NotFoundException('Produto não encontrado.');

    const precoVendaCalculado = preco * 1.5;

    return this.prisma.$transaction(async (prisma) => {

      const produtoAtualizado = await prisma.produto.update({
        where: { id },
        data: {
          quantidade: produto.quantidade + quantidade,
          precoCompra: preco > produto.precoCompra ? preco : produto.precoCompra,
          precoVenda: precoVendaCalculado > produto.precoVenda ? precoVendaCalculado : produto.precoVenda,
        },
      });

      const operacao = await prisma.operacao.create({
        data: {
          produtoId: id,
          tipo,
          quantidade,
          preco,
          total: quantidade * preco,
        },
      });

      return { ...operacao, produto: produtoAtualizado };
    });
  }

  async venderProdutos(id: number, vendaProduto: VendaProdutoDto): Promise<Operacao> {
    const tipo = 2;
    //desenvolver método que executa a operação de venda, retornando a venda com os respectivos dados do produto
    //tipo: 1 - compra, 2 - venda
    //calcular o valor total recebido na venda (quantidade * preco)
    //deve também atualizar a quantidade do produto, subtraindo a quantidade vendida
    //caso a quantidade seja esgotada, ou seja, chegue a 0, você deverá atualizar os precoVenda e precoCompra para 0
    // Validação da quantidade de venda

    const { quantidade } = vendaProduto;
    if (quantidade <= 0) {
      throw new BadRequestException('A quantidade vendida deve ser maior que zero.');
    }


    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }
    if (produto.quantidade < quantidade) {
      throw new BadRequestException('Quantidade insuficiente em estoque.');
    }


    return await this.prisma.$transaction(async (prisma) => {
      const novaQuantidade = produto.quantidade - quantidade;


      const produtoAtualizado = await prisma.produto.update({
        where: { id },
        data: {
          quantidade: novaQuantidade,
          precoCompra: novaQuantidade === 0 ? 0 : produto.precoCompra,
          precoVenda: novaQuantidade === 0 ? 0 : produto.precoVenda,
        },
      });


      const operacao = await prisma.operacao.create({
        data: {
          produtoId: id,
          tipo,
          quantidade,
          preco: produto.precoVenda,
          total: quantidade * produto.precoVenda,
        },
      });

      return { ...operacao, produto: produtoAtualizado };
    });
  }

}