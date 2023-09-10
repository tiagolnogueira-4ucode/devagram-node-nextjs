import type { NextApiRequest, NextApiResponse } from "next";
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import type { UsuarioRequisicao } from '../../types/UsuarioRequisicao';
import { UsuarioModel } from '../../models/UsuarioModel';
import bcrypt from 'bcrypt';

// Constantes de erro
const ERRO_METODO_INVALIDO = 'Método informado não é válido!';
const ERRO_NOME_INVALIDO = 'Nome inválido!';
const ERRO_EMAIL_INVALIDO = 'Email inválido!';
const ERRO_SENHA_INVALIDA = 'Senha inválida!';
const ERRO_EMAIL_EXISTENTE = 'Já existe uma conta com o email informado!';
const ERRO_CRIACAO_USUARIO = 'Erro ao cadastrar usuário!';

const validarUsuario = (usuario: UsuarioRequisicao) => {
    if (!usuario.nome || usuario.nome.length < 2) {
        throw new Error(ERRO_NOME_INVALIDO);
    }
    // Usando uma expressão regular simples para validação de e-mail
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!usuario.email || !emailRegex.test(usuario.email)) {
        throw new Error(ERRO_EMAIL_INVALIDO);
    }
    if (!usuario.senha || usuario.senha.length < 6) {
        throw new Error(ERRO_SENHA_INVALIDA);
    }
}

const endpointCadastro = async (
    req: NextApiRequest,
    res: NextApiResponse<RespostaPadraoMsg>
) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: ERRO_METODO_INVALIDO });
    }

    try {
        const usuario = req.body as UsuarioRequisicao;
        validarUsuario(usuario);

        const usuarioExistente = await UsuarioModel.findOne({ email: usuario.email });
        if (usuarioExistente) {
            return res.status(400).json({ erro: ERRO_EMAIL_EXISTENTE });
        }

        const senhaCriptografada = await bcrypt.hash(usuario.senha, 10);
        await UsuarioModel.create({
            ...usuario,
            senha: senhaCriptografada
        });

        return res.status(200).json({ msg: 'Usuário cadastrado com sucesso!' });

    } catch (error) {
        if (error instanceof Error) {
            if ([ERRO_NOME_INVALIDO, ERRO_EMAIL_INVALIDO, ERRO_SENHA_INVALIDA, ERRO_EMAIL_EXISTENTE].includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
        }
        return res.status(500).json({ erro: ERRO_CRIACAO_USUARIO });
    }
}

export default conectarMongoDB(endpointCadastro);