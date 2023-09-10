import type { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import mongoose from 'mongoose';
import type {RespostaPadraoMsg} from '../types/RespostaPadraoMsg';

const { DB_CONEXAO_STRING } = process.env;

if (!DB_CONEXAO_STRING) {
    throw new Error('Configuração DB não informada!');
}

mongoose.connection.on('connected', () => console.log('Banco de dados conectado.'));
mongoose.connection.on('error', (err) => console.log('Erro ao conectar com o banco de dados:', err));

export const conectarMongoDB = (handler: NextApiHandler) =>
    async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg>) => {

        if (mongoose.connections[0].readyState) {
            return handler(req, res);
        }

        try {
            await mongoose.connect(DB_CONEXAO_STRING);
            return handler(req, res);
        } catch (error) {
            return res.status(500).json({ erro: 'Erro ao conectar com o banco de dados.' });
        }
    }