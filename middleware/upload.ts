import multer from "multer";
import path from "path";
import { Request } from "express";

const storage = multer.memoryStorage();



// File Filter


const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void => {
    const allowedTypes =/jpeg|jpg|png|gif|webp/

    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    const mimetype = allowedTypes.test(file.mimetype);

    if(extname && mimetype) {
        return cb(null, true);
    }else{
        cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
}

// upload

const upload = multer({

    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
    },
    fileFilter: fileFilter,
})

export default upload;