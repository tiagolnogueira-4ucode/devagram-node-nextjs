import type { NextApiRequest, NextApiResponse } from "next";
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { SeguidorModel } from "@/models/SeguidorModel";
import { UsuarioModel } from "@/models/UsuarioModel";
import nc from 'next-connect';
import { politicaCORS } from "@/middlewares/politicaCors";

const ERROS = {
    USUARIO_NAO_ENCONTRADO: 'Usuário não encontrado!',
    ERRO_ATUALIZAR_SEGUINDO: 'Erro ao atualizar seguindo!'
};

const handler = nc<NextApiRequest, NextApiResponse>()
    .put(async (req, res) => {
        try {
            const { id, userId } = req.query;

            const usuarioLogado = await UsuarioModel.findById(id).select('-senha');
            const usuarioASerSeguido = await UsuarioModel.findById(userId).select('-senha');

            if (!usuarioLogado || !usuarioASerSeguido) throw new Error(ERROS.USUARIO_NAO_ENCONTRADO);

            const euJaSigoEsseUsuario = await SeguidorModel.find({ usuarioId: userId, usuarioSeguidoId: id });

            if (euJaSigoEsseUsuario.length > 0) {
                await SeguidorModel.deleteMany({ usuarioId: userId, usuarioSeguidoId: id });
                usuarioLogado.seguindo--;
                usuarioASerSeguido.seguidores--;
            } else {
                await SeguidorModel.create({ usuarioId: usuarioLogado._id, usuarioSeguidoId: usuarioASerSeguido._id });
                usuarioLogado.seguindo++;
                usuarioASerSeguido.seguidores++;
            }

            await Promise.all([
                UsuarioModel.findByIdAndUpdate(usuarioLogado._id, usuarioLogado),
                UsuarioModel.findByIdAndUpdate(usuarioASerSeguido._id, usuarioASerSeguido)
            ]);

            return res.status(200).json({ message: 'Seguindo atualizado com sucesso!' });

        } catch (error) {
            if (error instanceof Error && Object.values(ERROS).includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
            return res.status(500).json({ erro: ERROS.ERRO_ATUALIZAR_SEGUINDO });
        }
    });

export const config = {
    api: {
        bodyParser: false
    }
};

export default politicaCORS(validarTokenJWT(conectarMongoDB(handler)));