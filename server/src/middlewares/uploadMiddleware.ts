import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.mp3' || ext === '.wav' || ext === '.m4a' || ext === '.txt') {
      cb(null, true);
    } else {
      cb(new Error('Only audio (.mp3, .wav, .m4a) and text (.txt) files are allowed'));
    }
  }
});