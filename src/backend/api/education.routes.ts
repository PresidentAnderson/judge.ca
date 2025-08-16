import { Router, Request, Response, NextFunction } from 'express';
import db from '../utils/database';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/articles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, language = 'fr', limit = 10, offset = 0 } = req.query;

    let query = db('educational_content')
      .where('is_published', true)
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));

    if (category) {
      query = query.where('category', category as string);
    }

    const articles = await query.select(
      'id',
      language === 'fr' ? 'title_fr as title' : 'title_en as title',
      language === 'fr' ? 'content_fr as content' : 'content_en as content',
      'category',
      'tags',
      'author',
      'view_count',
      'created_at'
    );

    res.json({
      success: true,
      articles,
      total: articles.length
    });
  } catch (error) {
    next(error);
  }
});

router.get('/articles/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { language = 'fr' } = req.query;

    const article = await db('educational_content')
      .where({ id, is_published: true })
      .first();

    if (!article) {
      throw new AppError('Article not found', 404);
    }

    // Increment view count
    await db('educational_content')
      .where({ id })
      .increment('view_count', 1);

    res.json({
      success: true,
      article: {
        id: article.id,
        title: language === 'fr' ? article.title_fr : article.title_en,
        content: language === 'fr' ? article.content_fr : article.content_en,
        category: article.category,
        tags: article.tags,
        author: article.author,
        viewCount: article.view_count + 1,
        createdAt: article.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/faqs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, language = 'fr' } = req.query;

    let query = db('faqs')
      .where('is_active', true)
      .orderBy('order_index', 'asc');

    if (category) {
      query = query.where('category', category as string);
    }

    const faqs = await query.select(
      'id',
      language === 'fr' ? 'question_fr as question' : 'question_en as question',
      language === 'fr' ? 'answer_fr as answer' : 'answer_en as answer',
      'category'
    );

    res.json({
      success: true,
      faqs
    });
  } catch (error) {
    next(error);
  }
});

router.get('/glossary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { language = 'fr' } = req.query;

    // In a real implementation, this would come from a database
    const glossaryTerms = {
      fr: [
        { term: 'Provision', definition: 'Somme d\'argent versée à l\'avance à un avocat pour couvrir les frais juridiques.' },
        { term: 'Honoraires conditionnels', definition: 'Arrangement où l\'avocat n\'est payé que si l\'affaire est gagnée.' },
        { term: 'Pro bono', definition: 'Services juridiques fournis gratuitement pour le bien public.' },
        { term: 'Barreau', definition: 'Organisation professionnelle des avocats qui réglemente la profession.' },
        { term: 'Conflit d\'intérêts', definition: 'Situation où l\'avocat ne peut pas représenter équitablement un client.' },
        { term: 'Secret professionnel', definition: 'Obligation légale de confidentialité entre l\'avocat et son client.' }
      ],
      en: [
        { term: 'Retainer', definition: 'Money paid upfront to a lawyer to cover legal fees.' },
        { term: 'Contingency Fee', definition: 'Arrangement where the lawyer is only paid if the case is won.' },
        { term: 'Pro Bono', definition: 'Legal services provided free of charge for the public good.' },
        { term: 'Bar Association', definition: 'Professional organization of lawyers that regulates the profession.' },
        { term: 'Conflict of Interest', definition: 'Situation where the lawyer cannot fairly represent a client.' },
        { term: 'Attorney-Client Privilege', definition: 'Legal obligation of confidentiality between lawyer and client.' }
      ]
    };

    res.json({
      success: true,
      glossary: glossaryTerms[language as keyof typeof glossaryTerms] || glossaryTerms.fr
    });
  } catch (error) {
    next(error);
  }
});

export default router;