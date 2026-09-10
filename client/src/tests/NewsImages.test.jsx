import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NewsStrip from '../components/NewsStrip';
import News from '../pages/News';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

const POSTS = [
  {
    _id: '1',
    tag: 'launch',
    publishedAt: '2026-07-15T00:00:00.000Z',
    image: '/news/news_6.png',
    title: 'Business Centre launched',
    titleAr: 'إطلاق مركز الأعمال',
    excerpt: 'A shared business centre opens.',
    excerptAr: 'افتتاح مركز أعمال مشترك.'
  },
  {
    _id: '2',
    tag: 'service',
    publishedAt: '2026-07-08T00:00:00.000Z',
    image: '/news/news_5.png',
    title: 'Advance investor verification',
    titleAr: 'التحقق المسبق من المستثمر',
    excerpt: 'Verification now takes minutes.',
    excerptAr: 'التحقق صار يستغرق دقائق.'
  },
  {
    // No photograph — the programme did not supply one for this post.
    _id: '3',
    tag: 'announcement',
    publishedAt: '2026-06-11T00:00:00.000Z',
    title: 'Two banking partners join',
    titleAr: 'انضمام شريكين مصرفيين',
    excerpt: 'Preferential financing terms.',
    excerptAr: 'شروط تمويل تفضيلية.'
  }
];

vi.mock('../api/axios', () => ({
  default: { get: () => Promise.resolve({ data: { data: POSTS } }) }
}));

const renderWith = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </BrowserRouter>
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

/**
 * The programme's own blog leads every post with a photograph. Both places the
 * platform lists posts have to do the same, or the two disagree about what a
 * post looks like.
 */
describe('News posts carry their photograph', () => {
  test('the home strip leads each post with its picture', async () => {
    renderWith(<NewsStrip />);

    const img = await screen.findByAltText(POSTS[0].title);
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', '/news/news_6.png');
    // Below the fold on a long page, so it should not block first paint.
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  test('the news page leads each post with its picture too', async () => {
    renderWith(<News />);

    await waitFor(() =>
      expect(screen.getByAltText(POSTS[1].title)).toHaveAttribute('src', '/news/news_5.png')
    );
  });

  test('a post with no photograph is left out, not shown without one', async () => {
    renderWith(<News />);

    // The page is a wall of pictures now; a post without one would sit in it
    // as a hole. It comes back the moment an image is added to it.
    await waitFor(() => expect(screen.getByText(POSTS[0].title)).toBeInTheDocument());
    expect(screen.queryByText(POSTS[2].title)).toBeNull();
    expect(screen.queryByAltText(POSTS[2].title)).toBeNull();
  });

  test('the strip stays three cards long even when a post has no picture', async () => {
    renderWith(<NewsStrip />);
    await screen.findByAltText(POSTS[0].title);
    // It asks the API for more than it shows and keeps the first three with a
    // photograph, rather than asking for three and dropping one of them.
    const shown = POSTS.filter((p) => p.image);
    for (const p of shown) expect(screen.getByAltText(p.title)).toBeInTheDocument();
    expect(screen.queryByText(POSTS[2].title)).toBeNull();
  });

  test('the picture is described by the post it belongs to', async () => {
    renderWith(<NewsStrip />);
    // An empty alt would leave the card unlabelled for anyone not seeing it;
    // the headline is the honest description of the picture here.
    const img = await screen.findByAltText(POSTS[0].title);
    expect(img.getAttribute('alt')).toBe(POSTS[0].title);
  });

  test('no tag is printed on a card any more', async () => {
    renderWith(<NewsStrip />);
    await screen.findByAltText(POSTS[0].title);
    // The tags and their filter chips were removed from both surfaces; what
    // remains must not leak the raw key either.
    expect(screen.queryByText(translations.en['news.tag.launch'])).toBeNull();
    expect(screen.queryByText('launch')).toBeNull();
  });

  test('in Arabic the picture is described in Arabic', async () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderWith(<NewsStrip />);
    expect(await screen.findByAltText(POSTS[0].titleAr)).toBeInTheDocument();
  });
});
