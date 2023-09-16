import mongoose, { Schema } from 'mongoose';

const SeguidoresSchema = new Schema({
    usuarioId: { type: String, required: true },
    usuarioSeguidoId: { type: String, required: true }
});


export const SeguidorModel = mongoose.models.seguidores || mongoose.model('seguidores', SeguidoresSchema);