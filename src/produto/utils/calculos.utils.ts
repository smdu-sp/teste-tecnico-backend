export const precoParaInteiro = (preco: number) => Math.round(preco * 100);

export const inteiroParaPreco = (inteiro: number) => (inteiro / 100).toFixed(2);

export const calcularTotalCompra = (
  preco: number,
  quantidade: number,
): number => {
  return preco * quantidade;
};

export const verificarMargemLucro = (
  precoCompra: number,
  precoVenda: number,
): boolean => {
  return precoParaInteiro(precoCompra) * 2 >= precoParaInteiro(precoVenda);
};
