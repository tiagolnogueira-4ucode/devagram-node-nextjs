import type { NextApiRequest, NextApiResponse } from "next";
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import type { LoginResposta } from '../../types/LoginResposta';
import { UsuarioModel } from '../../models/UsuarioModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Constantes de erro
const ERRO_AUTENTICACAO = 'Usuário ou senha não encontrado!';
const ERRO_METODO_INVALIDO = 'Método informado não é válido!';
const ERRO_JWT = 'JWT não informado!';


const autenticarUsuario = async (login: string, senha: string, MINHA_CHAVE_JWT: any) => {
    const usuarioEncontrado = await UsuarioModel.findOne({ email: login });

    if (usuarioEncontrado && await bcrypt.compare(senha, usuarioEncontrado.senha)) {
        const token = jwt.sign({_id : usuarioEncontrado.id}, MINHA_CHAVE_JWT);

        return {usuarioEncontrado, token};
    }
    return null;
}

const endpointLogin = async (
    req: NextApiRequest,
    res: NextApiResponse<RespostaPadraoMsg | LoginResposta>
) => {
   
    const {MINHA_CHAVE_JWT} = process.env;

    if(!MINHA_CHAVE_JWT) {
        res.status(500).json({ erro: ERRO_JWT });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ erro: ERRO_METODO_INVALIDO });
    }

    const { login, senha } = req.body;
    const usuarioAutenticado = await autenticarUsuario(login, senha, MINHA_CHAVE_JWT);

    if (usuarioAutenticado) {
        res.status(200).json({ 
            nome : usuarioAutenticado.usuarioEncontrado.nome,
            email : usuarioAutenticado.usuarioEncontrado.email,
            token : usuarioAutenticado.token
         });
    } else {
        res.status(401).json({ erro: ERRO_AUTENTICACAO });
    }
}

export default conectarMongoDB(endpointLogin);