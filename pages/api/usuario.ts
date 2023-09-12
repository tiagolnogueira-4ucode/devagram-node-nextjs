import type { NextApiRequest, NextApiResponse } from "next";
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { UsuarioModel } from "@/models/UsuarioModel";

type UsuarioResponse = RespostaPadraoMsg & { usuario?: typeof UsuarioModel };

const retrieveUsuario = async (userId: string) => {
    const usuario = await UsuarioModel.findById(userId).select('-senha');
    if (!usuario) {
        throw new Error("Usuário não encontrado.");
    }
    return usuario;
};

const handleGetRequest = async (req: NextApiRequest) => {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
        throw new Error("ID do usuário não fornecido ou inválido.");
    }

    return await retrieveUsuario(userId);
};

const usuarioEndpoint = async (
    req: NextApiRequest,
    res: NextApiResponse<UsuarioResponse>
) => {
    try {
        const usuario = await handleGetRequest(req);
        return res.status(200).json({ usuario });
    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ erro: error.message });
        }
        console.error(error);
        return res.status(500).json({ erro: 'Não foi possível obter o usuário!' });
    }
}

export default validarTokenJWT(conectarMongoDB(usuarioEndpoint));