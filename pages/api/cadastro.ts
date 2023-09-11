import type { NextApiRequest, NextApiResponse } from "next";
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import type { UsuarioRequisicao } from '../../types/UsuarioRequisicao';
import { UsuarioModel } from '../../models/UsuarioModel';
import bcrypt from 'bcrypt';
import { upload, uploadImagemCosmic } from '../../services/uploadImagemCosmic';
import nc from 'next-connect';

// Constantes de erro
const ERROS = {
    METODO_INVALIDO: 'Método informado não é válido!',
    NOME_INVALIDO: 'Nome inválido!',
    EMAIL_INVALIDO: 'Email inválido!',
    SENHA_INVALIDA: 'Senha inválida!',
    EMAIL_EXISTENTE: 'Já existe uma conta com o email informado!',
    CRIACAO_USUARIO: 'Erro ao cadastrar usuário!'
};

const validarUsuario = (usuario: UsuarioRequisicao) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!usuario.nome || usuario.nome.length < 2) throw new Error(ERROS.NOME_INVALIDO);
    if (!usuario.email || !emailRegex.test(usuario.email)) throw new Error(ERROS.EMAIL_INVALIDO);
    if (!usuario.senha || usuario.senha.length < 6) throw new Error(ERROS.SENHA_INVALIDA);
}

const handler = nc<NextApiRequest, NextApiResponse<RespostaPadraoMsg>>()
    .use(upload.single('file'))
    .post(async (req, res) => {
        try {
            const { nome, email, senha } = req.body as UsuarioRequisicao;
            validarUsuario({ nome, email, senha });

            const usuarioExistente = await UsuarioModel.findOne({ email });
            if (usuarioExistente) return res.status(400).json({ erro: ERROS.EMAIL_EXISTENTE });

            const image = await uploadImagemCosmic(req);
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            await UsuarioModel.create({
                nome,
                email,
                senha: senhaCriptografada,
                avatar: image.media.url
            });

            return res.status(200).json({ msg: 'Usuário cadastrado com sucesso!' });

        } catch (error) {
            if (error instanceof Error && Object.values(ERROS).includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
            return res.status(500).json({ erro: ERROS.CRIACAO_USUARIO });
        }
    });

export const config = {
    api: {
        bodyParser: false
    }
}

export default conectarMongoDB(handler);