import { Module } from '@nestjs/common';
import { ProdutoService } from './produto.service';
import { ProdutoController } from './produto.controller';
import { ProdutoUtils } from './utils/produto.utils';

@Module({
  controllers: [ProdutoController],
  providers: [ProdutoService, ProdutoUtils],
})
export class ProdutoModule {}
