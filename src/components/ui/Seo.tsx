import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { asset } from '../../lib/asset';

const SITE_NAME = 'IT-куб Якутск';
const DEFAULT_DESCRIPTION =
  'Центр цифрового образования детей «IT-куб» г. Якутска: направления для школьников 6–18 лет — программирование, робототехника, VR/AR, дизайн.';

// Адрес сайта после публикации (например, https://itcube.vercel.app) задаётся в файле .env:
// VITE_SITE_URL=https://… — нужен для полных ссылок в превью соцсетей
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

type Props = {
  title?: string;
  description?: string;
  // 'article' — для новостей, 'website' — для остальных страниц
  type?: 'website' | 'article';
  // true — страницу не нужно показывать в поисковиках (например, 404)
  noindex?: boolean;
};

/**
 * Заголовок вкладки, описание для поисковиков и Open Graph-теги
 * (то, что показывают ВКонтакте и Telegram при отправке ссылки).
 * react-helmet-async подменяет теги в <head> при переходе между страницами.
 */
export function Seo({ title, description = DEFAULT_DESCRIPTION, type = 'website', noindex = false }: Props) {
  const { pathname } = useLocation();
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — центр цифрового образования детей`;
  const text = description.length > 200 ? `${description.slice(0, 197).replace(/\s+\S*$/, '')}…` : description;
  const image = `${SITE_URL}${asset('/og-image.png')}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={text} />
      {noindex && <meta name="robots" content="noindex" />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ?? fullTitle} />
      <meta property="og:description" content={text} />
      <meta property="og:image" content={image} />
      {SITE_URL && <meta property="og:url" content={`${SITE_URL}${pathname}`} />}
      {SITE_URL && <link rel="canonical" href={`${SITE_URL}${pathname}`} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
