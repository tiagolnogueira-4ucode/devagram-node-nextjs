import type { NextApiRequest, NextApiResponse } from "next";
import { conectarMongoDB } from '@/middlewares/conectaMongoDB';
import { validarTokenJWT } from '@/middlewares/validarTokenJWT';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import { upload, uploadImagemCosmic } from '../../services/uploadImagemCosmic';
import nc from 'next-connect';
import { PublicacaoModel } from '../../models/PublicacaoModel';
import { UsuarioModel } from '../../models/UsuarioModel';

const ERROS = {
    METODO_INVALIDO : 'Método informado não é válido!',
    DESCRICAO_INVALIDA : 'Descrição inválida!',
    ARQUIVO_OBRIGATORIO : 'Arquivo obrigatório!',
    CRIACAO_PUBLICACAO : 'Erro ao realizar uma publicação!',
    PARAMETROS_INVALIDOS : 'Parâmetros de entrada inválidos!',
    USUARIO_NAO_ENCONTRADO : 'Usuário não encontrado!'
}

const validateRequest = (req: any) => {
    const { descricao } = req.body;
    if (!descricao || descricao.length < 2) {
        throw new Error(ERROS.DESCRICAO_INVALIDA);
    }
    if (!req.file || !req.file.originalname) {
        throw new Error(ERROS.ARQUIVO_OBRIGATORIO);
    }
};

const handler = nc<NextApiRequest, NextApiResponse<RespostaPadraoMsg>>()
    .use(upload.single('file'))
    .post(async (req, res) => {
        try {
            const { userId } = req.query;
            const usuario = await UsuarioModel.findById(userId);

            if (!usuario) {
                return res.status(400).json({ erro: ERROS.USUARIO_NAO_ENCONTRADO });
            }

            validateRequest(req);

            const image = await uploadImagemCosmic(req);

            await PublicacaoModel.create({
                idUsuario: usuario._id,
                descricao: req.body.descricao,
                foto: image.media.url,
                data: new Date()
            });

            return res.status(200).json({ msg: 'Publicação criada com sucesso!' });

        } catch (error) {
            if (error instanceof Error && Object.values(ERROS).includes(error.message)) {
                return res.status(400).json({ erro: error.message });
            }
            console.error(error);
            return res.status(500).json({ erro: ERROS.CRIACAO_PUBLICACAO });
        }
    });

export const config = {
    api: {
        bodyParser: false
    }
}

export default validarTokenJWT(conectarMongoDB(handler));