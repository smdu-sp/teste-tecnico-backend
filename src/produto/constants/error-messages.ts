export const ERROR_MESSAGES = {
    NOT_FOUND: 'Produto não encontrado ou não cadastrado.',
    CANNOT_CREATE: 'Não foi possível criar este produto.',
    CANNOT_UPDATE: 'Produto não pode ser atualizado.',
    CANNOT_DELETE: 'Produto não pode ser excluído.',
    CANNOT_BUY: 'Não foi possível efetuar a compra.',
    CANNOT_SALE: 'Não foi possível efetuar a venda.',
    INSUFFICIENT_STOCK: (quantidade: number) => `Quantidade insuficiente de produtos, há apenas ${quantidade} unidades deste produto em estoque`,
    INVALID_DATE: 'A data informada não pode ser no passado ou é inválida.',
    LOW_PURCHASE_PRICE: 'Valor de compra oferecido está abaixo do mercado.',
    LIST_NOT_FOUND: 'Não foi possível buscar os produtos.'
  };