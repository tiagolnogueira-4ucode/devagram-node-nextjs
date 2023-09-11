import { createBucketClient } from "@cosmicjs/sdk";
import multer from "multer";

const { BUCKET_SLUG, READ_KEY, WRITE_KEY } = process.env;

const bucketDevagram = createBucketClient({
    bucketSlug: BUCKET_SLUG!,
    readKey: READ_KEY!,
    writeKey: WRITE_KEY!
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

enum ImageFolders {
    PUBLICACAO = "publicacao",
    CADASTRO = "avatar",
    DEFAULT = "stories"
}

const validExtensions = new Set([".png", ".jpg", ".jpeg"]);

const determineFolder = (url: string): ImageFolders => {
    if (url.includes("publicacao")) return ImageFolders.PUBLICACAO;
    if (url.includes("cadastro")) return ImageFolders.CADASTRO;
    return ImageFolders.DEFAULT;
};

const validateImageExtension = (filename: string): void => {
    const ext = filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
    if (!validExtensions.has(`.${ext}`)) {
        throw new Error("Extensão da imagem inválida");
    }
};

const uploadImagemCosmic = async (req: any) => {
    const { file, url } = req;

    if (file?.originalname) {
        validateImageExtension(file.originalname);
    }

    const media_object = {
        originalname: file.originalname,
        buffer: file.buffer
    };

    const folder = determineFolder(url);

    return await bucketDevagram.media.insertOne({
        media: media_object,
        folder
    });
};

export { upload, uploadImagemCosmic };