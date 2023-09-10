import type { NextApiRequest, NextApiResponse } from "next";
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import {validarTokenJWT} from '@/middlewares/validarTokenJWT';

const USUARIO_AUTENTICADO = 'Usuário autenticado com sucesso!';

const usuarioEndpoint =  async (
    req: NextApiRequest,
    res: NextApiResponse<RespostaPadraoMsg>
) => {
    return res.status(200).json({msg: USUARIO_AUTENTICADO});
}

export default validarTokenJWT(usuarioEndpoint);