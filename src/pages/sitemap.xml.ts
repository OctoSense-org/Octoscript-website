import type { APIRoute } from 'astro';
import { content, route } from '../data/content';
export const GET: APIRoute = ({ site }) => {
  const paths = ['', 'docs/', ...content.en.guides.map(guide => `docs/${guide.slug}/`)];
  const urls = (['en', 'cn'] as const).flatMap(locale => paths.map(path => `<url><loc>${new URL(route(locale, path), site)}</loc></url>`)).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
