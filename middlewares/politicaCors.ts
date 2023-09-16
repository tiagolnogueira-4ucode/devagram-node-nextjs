import type { NextApiRequest, NextApiResponse } from "next";
import type { RespostaPadraoMsg } from '../types/RespostaPadraoMsg';
import NextCors from 'nextjs-cors';

export const politicaCORS = (handler: (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg>) => void) => {
    return async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg>) => {
        try {
            await NextCors(req, res, {
                origin: '*',
                methods: ['GET', 'POST', 'PUT'],
                optionsSuccessStatus: 200,
            });
            return handler(req, res);
        } catch (error: any) {
            console.error("Erro ao aplicar política CORS:", error.message);
            res.status(500).json({ erro: "Erro interno do servidor." });
        }
    };
};