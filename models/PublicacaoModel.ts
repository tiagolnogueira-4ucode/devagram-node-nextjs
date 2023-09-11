import mongoose, { Document, Schema } from 'mongoose';

enum CollectionNames {
    PUBLICACOES = 'publicacoes'
}

interface IPublicacao extends Document {
    idUsuario: string;
    descricao: string;
    foto: string;
    data: Date;
    comentarios: string[];
    likes: string[];
}

const PublicacaoSchema: Schema = new Schema({
    idUsuario: { type: String, required: true },
    descricao: { type: String, required: true },
    foto: { type: String, required: true, unique: true, index: true },
    data: { type: Date, required: true, default: Date.now },
    comentarios: { type: [String], required: true, default: [] },
    likes: { type: [String], required: true, default: [] }
});

export const PublicacaoModel = mongoose.models[CollectionNames.PUBLICACOES] || mongoose.model<IPublicacao>(CollectionNames.PUBLICACOES, PublicacaoSchema);
