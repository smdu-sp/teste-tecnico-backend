import { IsOptional, IsString, Length } from "class-validator";

export class CreateProdutoDto {
    @IsString({message: 'o nome deve ser uma string.'})
    @Length(1, 120, {message: 'o nome suporta até 120 carcteres'})
    nome: string;

    @IsOptional()
    @IsString({message: 'a descrição deve ser uma string.'})
    @Length(0, 500, {message: 'a descrição suporta até 500 caracteres'})
    descricao?: string;
}
