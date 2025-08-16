import type { CollectionEntry } from 'astro:content';

export function getBlogPostUrl(post: CollectionEntry<'blog'>): string {
	return post.data.permalink ? `/${post.data.permalink}` : `/blog/${post.id}/`;
}
