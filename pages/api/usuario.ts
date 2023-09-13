import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { UsuarioModel } from "@/models/UsuarioModel";
import { upload, uploadImagemCosmic } from '../../services/uploadImagemCosmic';
import nc from 'next-connect';

const ERROS = {
    METODO_INVALIDO: 'Método informado não é válido!',
    USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado!',
    ERRO_ALTERACAO: 'Erro ao realizar uma atualização!',
    ERRO_OBTER_USUARIO: 'Erro ao obter o usuário!',
};

const retrieveUsuario = async (userId: string) => {
    const usuario = await UsuarioModel.findById(userId).select('-senha');
    if (!usuario) throw new Error(ERROS.USUARIO_NAO_ENCONTRADO);
    return usuario;
};

const handler = nc<NextApiRequest | any, NextApiResponse>()
    .use(upload.single('file'))
    .put(async (req, res) => {
        try {
            const { userId } = req.query;
            const { nome } = req.body;

            const usuario = await retrieveUsuario(userId);

            if (nome) usuario.nome = nome;
            if (req.file) {
                const image = await uploadImagemCosmic(req);
                usuario.avatar = image.media.url;
            }

            await usuario.save();
            return res.status(200).json({ msg: 'Usuário alterado com sucesso!' });

        } catch (error) {
            if (error instanceof Error && Object.values(ERROS).includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
            return res.status(500).json({ erro: ERROS.ERRO_ALTERACAO });
        }
    })
    .get(async (req, res) => {
        try {
            const { userId } = req.query;
            const usuario = await retrieveUsuario(userId);
            return res.status(200).json({ usuario });
        } catch (error) {
            if (error instanceof Error && Object.values(ERROS).includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
            return res.status(500).json({ erro: ERROS.ERRO_OBTER_USUARIO });
        }
    });

export const config = {
    api: {
        bodyParser: false
    }
};

export default validarTokenJWT(conectarMongoDB(handler));