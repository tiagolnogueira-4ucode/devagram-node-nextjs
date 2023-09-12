import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { UsuarioModel } from "@/models/UsuarioModel";
import { PublicacaoModel } from "@/models/PublicacaoModel";
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';

type FeedResponse = { publicacoes?: typeof PublicacaoModel[] } & RespostaPadraoMsg;

const retrieveUsuario = async (userId: string) => {
    const usuario = await UsuarioModel.findById(userId).select('-senha');
    if (!usuario) {
        throw new Error("Usuário não encontrado.");
    }
    return usuario;
};

const retrievePublicacoes = async (userId: string) => {
    return await PublicacaoModel.find({ idUsuario: userId }).sort({ data: -1 }) || [];
};

const validateRequestMethod = (method: any) => {
    if (method !== 'GET') {
        throw new Error("Método informado é inválido.");
    }
};

const getUsuarioAndPublicacoes = async (req: NextApiRequest) => {
    validateRequestMethod(req.method);
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        throw new Error("ID do usuário não fornecido ou inválido.");
    }

    const usuario = await retrieveUsuario(userId);
    const publicacoes = await retrievePublicacoes(usuario._id);

    return publicacoes;
};

const feedEndpoint = async (
    req: NextApiRequest,
    res: NextApiResponse<FeedResponse>
) => {
    try {
        const publicacoes = await getUsuarioAndPublicacoes(req);
        return res.status(200).json({ publicacoes });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ erro: error.message });
        }
        console.error(error);
        return res.status(500).json({ erro: 'Não foi possível obter o feed!' });
    }
}

export default validarTokenJWT(conectarMongoDB(feedEndpoint));