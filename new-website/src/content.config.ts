import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ 
		base: './src/content/blog', 
		pattern: '**/*.{md,mdx}',
		generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '')
	}),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
		}),
});

const projects = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ 
		base: './src/content/projects', 
		pattern: '**/*.{md,mdx}',
		generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '')
	}),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
		}),
});


const testimonials = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ 
		base: './src/content/testimonials', 
		pattern: '**/*.{md,mdx}',
		generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '')
	}),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			author: z.string(),
			position: z.string(),
			image: image(),
		}),
});

export const collections = { blog, projects, testimonials };
