import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { UsuarioModel } from "@/models/UsuarioModel";
import nc from 'next-connect';

const ERROS = {
    FILTRO_INVALIDO: 'Filtro inválido ou muito curto!',
    USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado!',
    ERRO_OBTER_USUARIO: 'Erro ao obter o usuário!'
};

const getUsuarioById = async (id: string) => {
    const usuario = await UsuarioModel.findById(id).select('-senha');
    if (!usuario) throw new Error(ERROS.USUARIO_NAO_ENCONTRADO);
    return usuario;
};

const getUsuariosByFiltro = async (filtro: string) => {
    if (typeof filtro !== 'string' || filtro.length < 2) {
        throw new Error(ERROS.FILTRO_INVALIDO);
    }

    const usuarios = await UsuarioModel.find({
        $or: [
            { nome: { $regex: filtro, $options: 'i' } },
            { email: { $regex: filtro, $options: 'i' } }
        ]
    }).select('-senha');

    if (!usuarios.length) throw new Error(ERROS.USUARIO_NAO_ENCONTRADO);
    return usuarios;
};

const handler = nc<NextApiRequest, NextApiResponse>()
    .get(async (req, res) => {
        try {
            const { filtro, id } = req.query;

            if (id) {
                const usuario = await getUsuarioById(id as string);
                return res.status(200).json({ usuario });
            }

            const usuarios = await getUsuariosByFiltro(filtro as string);
            return res.status(200).json({ usuarios });

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