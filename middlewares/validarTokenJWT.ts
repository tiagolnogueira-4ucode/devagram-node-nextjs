import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import type { RespostaPadraoMsg } from '../types/RespostaPadraoMsg';
import jwt, { JwtPayload } from "jsonwebtoken";

const ERRO_JWT = 'JWT não informado!';
const NAO_AUTORIZADO = 'Não autorizado!';
const BEARER = 'Bearer';
const OPTIONS_METHOD = 'OPTIONS';

const getDecodedToken = (token: string, secretKey: string): JwtPayload | null => {
    try {
        return jwt.verify(token, secretKey) as JwtPayload;
    } catch (error) {
        return null;
    }
};

export const validarTokenJWT = (handler: NextApiHandler) =>
    async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg>) => {

        const MINHA_CHAVE_JWT = process.env.MINHA_CHAVE_JWT;

        if (!MINHA_CHAVE_JWT) {
            return res.status(500).json({ erro: ERRO_JWT });
        }

        if (req.method !== OPTIONS_METHOD) {
            const authorization = req.headers['authorization'];
            const token = authorization?.startsWith(BEARER) ? authorization.split(' ')[1] : null;

            if (!token) {
                return res.status(401).json({ erro: NAO_AUTORIZADO });
            }

            const decoded = getDecodedToken(token, MINHA_CHAVE_JWT);

            if (!decoded || !decoded._id) {
                return res.status(401).json({ erro: NAO_AUTORIZADO });
            }

            req.query.userId = decoded._id;
        }

        return handler(req, res);
    }