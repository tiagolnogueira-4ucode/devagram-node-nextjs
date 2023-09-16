import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { UsuarioModel } from "@/models/UsuarioModel";
import { PublicacaoModel } from "@/models/PublicacaoModel";
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import { SeguidorModel } from "@/models/SeguidorModel";

type FeedResponse = { publicacoes?: typeof PublicacaoModel[] } & RespostaPadraoMsg;

const retrieveEntity = async (Model: any, id: string, errorMessage: string, selectFields?: string) => {
    const entity = await Model.findById(id).select(selectFields);
    if (!entity) throw new Error(errorMessage);
    return entity;
};

const retrievePublicacoes = async (userId: string, seguidoresIds: string[] = []) => {
    return await PublicacaoModel.find({ 
        idUsuario: { $in: [userId, ...seguidoresIds] }
    }).sort({ data: -1 }) || [];
};

const retrieveSeguidores = async (userId: string) => {
    const seguidores = await SeguidorModel.find({ usuarioId: userId });
    return seguidores.map(s => s.usuarioSeguidoId);
};

const getUsuarioAndPublicacoes = async (req: NextApiRequest) => {
    const { userId, id } = req.query;

    if (!userId || typeof userId !== 'string') throw new Error("ID do usuário não fornecido ou inválido.");

    const targetId = id ? id.toString() : userId;
    const usuario = await retrieveEntity(UsuarioModel, targetId, "Usuário não encontrado.", '-senha');
    const seguidoresIds = id ? [] : await retrieveSeguidores(userId);
    const publicacoes = await retrievePublicacoes(usuario._id, seguidoresIds);

    return await Promise.all(publicacoes.map(async (publicacao) => {
        const usuarioDaPublicacao = await retrieveEntity(UsuarioModel, publicacao.idUsuario, "");
        return usuarioDaPublicacao ? { ...publicacao._doc, usuario: { nome: usuarioDaPublicacao.nome, avatar: usuarioDaPublicacao.avatar } } : null;
    }));
};

const feedEndpoint = async (req: NextApiRequest, res: NextApiResponse<FeedResponse>) => {
    try {
        if (req.method !== 'GET') throw new Error("Método informado é inválido.");

        const publicacoes = await getUsuarioAndPublicacoes(req);
        return res.status(200).json({ publicacoes });
    } catch (error) {
        if (error instanceof Error) return res.status(400).json({ erro: error.message });
        console.error(error);
        return res.status(500).json({ erro: 'Não foi possível obter o feed!' });
    }
}

export default validarTokenJWT(conectarMongoDB(feedEndpoint));