import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { PublicacaoModel } from "@/models/PublicacaoModel";
import { UsuarioModel } from "@/models/UsuarioModel";
import nc from 'next-connect';
import { politicaCORS } from "@/middlewares/politicaCors";

const ERROS = {
    PUBLICACAO_NAO_ENCONTRADA: 'Publicação não encontrada!',
    ERRO_OBTER_PUBLICACAO: 'Erro ao obter a publicação!',
    USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado!'
};

const getEntityById = async (Model: any, id: string, error: string, selectFields?: string) => {
    const entity = await Model.findById(id).select(selectFields);
    if (!entity) throw new Error(error);
    return entity;
};

const toggleLike = async (publicacaoId: string, usuarioId: string) => {
    const publicacao = await getEntityById(PublicacaoModel, publicacaoId, ERROS.PUBLICACAO_NAO_ENCONTRADA);
    const isLiked = publicacao.likes.includes(usuarioId);

    const updateOperation = isLiked ? { $pull: { likes: usuarioId } } : { $push: { likes: usuarioId } };
    await PublicacaoModel.findByIdAndUpdate(publicacaoId, updateOperation);
};

const handler = nc<NextApiRequest, NextApiResponse>()
    .put(async (req, res) => {
        try {
            const { id, userId } = req.query;

            await getEntityById(UsuarioModel, userId as string, ERROS.USUARIO_NAO_ENCONTRADO, '-senha');
            await toggleLike(id as string, userId as string);

            return res.status(200).json({ message: 'Like atualizado com sucesso!' });

        } catch (error) {
            if (error instanceof Error && Object.values(ERROS).includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
            return res.status(500).json({ erro: ERROS.ERRO_OBTER_PUBLICACAO });
        }
    });

export const config = {
    api: {
        bodyParser: false
    }
};

export default politicaCORS(validarTokenJWT(conectarMongoDB(handler)));