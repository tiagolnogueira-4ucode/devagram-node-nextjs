import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { UsuarioModel } from "@/models/UsuarioModel";
import { PublicacaoModel } from "@/models/PublicacaoModel";
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import { politicaCORS } from "@/middlewares/politicaCors";

type RespostaFeed = { publicacoes?: typeof PublicacaoModel[] } & RespostaPadraoMsg;

const buscarEntidadePorId = async (Model: any, id: string, mensagemErro: string, camposSelecionados?: string) => {
    const entidade = await Model.findById(id).select(camposSelecionados);
    if (!entidade) throw new Error(mensagemErro);
    return entidade;
};

const adicionarComentarioAPublicacao = async (usuario: any, idPublicacao: any, textoComentario: string) => {
    const comentario = {
        usuarioId: usuario._id,
        nome: usuario.nome,
        comentario: textoComentario
    };

    return await PublicacaoModel.findByIdAndUpdate(idPublicacao, { $push: { comentarios: comentario } }, { new: true });
};

const tratarRequisicaoComentario = async (req: NextApiRequest, res: NextApiResponse<RespostaFeed>) => {
    try {
        if (req.method !== 'PUT') throw new Error("Método de requisição inválido.");

        const { userId, id } = req.query;
        const { comentario } = req.body;

        if (!userId || typeof userId !== 'string') throw new Error("ID do usuário inválido.");
        if (!comentario || comentario.length < 2) throw new Error("Comentário inválido.");

        const usuario = await buscarEntidadePorId(UsuarioModel, userId, "Usuário não encontrado.", '-senha');
        const publicacaoAtualizada = await adicionarComentarioAPublicacao(usuario, id, comentario);

        return res.status(200).json({ publicacoes: [publicacaoAtualizada] });
    } catch (error) {
        if (error instanceof Error) return res.status(400).json({ erro: error.message });
        console.error(error);
        return res.status(500).json({ erro: 'Falha ao adicionar o comentário.' });
    }
}

export default politicaCORS(validarTokenJWT(conectarMongoDB(tratarRequisicaoComentario)));