import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { createNote, deleteNote, listNotes, updateNote } from '../controllers/notesController';

const router = Router();

router.use(authenticate);

const validateNoteContent = [body('content').trim().isLength({ min: 1 }).withMessage('Conteúdo é obrigatório')];
const validateNoteId = [param('id').isMongoId().withMessage('ID inválido')];

router.get('/', listNotes);
router.post('/', validateNoteContent, createNote);
router.put('/:id', [...validateNoteId, ...validateNoteContent], updateNote);
router.delete('/:id', validateNoteId, deleteNote);

export default router;
