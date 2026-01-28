import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Supported languages for i18n (excluding 'en' which uses default collections)
const I18N_LANGUAGES = ['es', 'fr', 'de', 'ja', 'zh', 'it', 'sv'] as const;

// Define schema for blog posts
const postsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().default('Untitled Post'),
    description: z.string().nullable().optional().default('No description provided'),
    date: z.coerce.date().default(() => new Date()),
    tags: z.array(z.string()).nullable().optional(),
    draft: z.boolean().optional(),
    image: z.any().nullable().optional().transform((val) => {
      // Handle various Obsidian syntax formats
      if (Array.isArray(val)) {
        // Handle array format from [[...]] syntax - take first element
        return val[0] || null;
      }
      if (typeof val === 'string') {
        // Handle string format - return as-is
        return val;
      }
      return null;
    }),
    imageOG: z.boolean().optional(),
    imageAlt: z.string().nullable().optional(),
    hideCoverImage: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    showTOC: z.boolean().optional(),
    targetKeyword: z.string().nullable().optional(),
    author: z.string().nullable().optional(),
    noIndex: z.boolean().optional(),
  }),
});

// Define schema for static pages
const pagesCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().default('Untitled Page'),
    description: z.string().nullable().optional().default('No description provided'),
    draft: z.boolean().optional(),
    lastModified: z.coerce.date().optional(),
    image: z.any().nullable().optional().transform((val) => {
      // Handle various Obsidian syntax formats
      if (Array.isArray(val)) {
        // Handle array format from [[...]] syntax - take first element
        return val[0] || null;
      }
      if (typeof val === 'string') {
        // Handle string format - return as-is
        return val;
      }
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    hideCoverImage: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    showTOC: z.boolean().optional(),
    noIndex: z.boolean().optional(),
  }),
});

// Define schema for projects
const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().default('Untitled Project'),
    description: z.string().nullable().optional().default('No description provided'),
    date: z.coerce.date().default(() => new Date()),
    categories: z.array(z.string()).nullable().optional().default([]),
    repositoryUrl: z.union([z.string(), z.null(), z.undefined()]).optional().transform(val => val || ''),
    projectUrl: z.union([z.string(), z.null(), z.undefined()]).optional().transform(val => val || ''),
    demoUrl: z.union([z.string(), z.null(), z.undefined()]).optional().transform(val => val || ''),
    demoURL: z.union([z.string(), z.null(), z.undefined()]).optional().transform(val => val || ''),
    status: z.string().nullable().optional(),
    image: z.any().nullable().optional().transform((val) => {
      // Handle various Obsidian syntax formats
      if (Array.isArray(val)) {
        // Handle array format from [[...]] syntax - take first element
        return val[0] || null;
      }
      if (typeof val === 'string') {
        // Handle string format - return as-is
        return val;
      }
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    hideCoverImage: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    showTOC: z.boolean().optional(),
    draft: z.boolean().optional(),
    noIndex: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
});

// Define schema for docs
const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: z.object({
    title: z.string().default('Untitled Documentation'),
    description: z.string().nullable().optional().default('No description provided'),
    category: z.string().nullable().optional().default('General'),
    order: z.number().default(0),
    lastModified: z.coerce.date().optional(),
    version: z.string().nullable().optional(),
    image: z.any().nullable().optional().transform((val) => {
      // Handle various Obsidian syntax formats
      if (Array.isArray(val)) {
        // Handle array format from [[...]] syntax - take first element
        return val[0] || null;
      }
      if (typeof val === 'string') {
        // Handle string format - return as-is
        return val;
      }
      return null;
    }),
    imageAlt: z.string().nullable().optional(),
    hideCoverImage: z.boolean().optional(),
    hideTOC: z.boolean().optional(),
    draft: z.boolean().optional(),
    noIndex: z.boolean().optional(),
    showTOC: z.boolean().optional(),
    featured: z.boolean().optional(),
  }),
});

// Define schema for special home pages (homepage blurb, 404, projects index, docs index)
const specialCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/special' }),
  schema: z.object({
    title: z.string().default('Untitled Page'),
    description: z.string().nullable().optional().default('No description provided'),
    hideTOC: z.boolean().optional(),
    // These pages have fixed URLs and special logic
    // URLs are determined by the file location, not frontmatter
  }),
});

// Reusable schemas for i18n collections
const postSchema = postsCollection.schema;
const pageSchema = pagesCollection.schema;
const projectSchema = projectsCollection.schema;
const docSchema = docsCollection.schema;

// Helper to create i18n collections for a language
function createI18nCollections(lang: string) {
  return {
    [`posts-${lang}`]: defineCollection({
      loader: glob({ pattern: '**/*.{md,mdx}', base: `./src/content-i18n/${lang}/posts` }),
      schema: postSchema,
    }),
    [`pages-${lang}`]: defineCollection({
      loader: glob({ pattern: '**/*.{md,mdx}', base: `./src/content-i18n/${lang}/pages` }),
      schema: pageSchema,
    }),
    [`projects-${lang}`]: defineCollection({
      loader: glob({ pattern: '**/*.{md,mdx}', base: `./src/content-i18n/${lang}/projects` }),
      schema: projectSchema,
    }),
    [`docs-${lang}`]: defineCollection({
      loader: glob({ pattern: '**/*.{md,mdx}', base: `./src/content-i18n/${lang}/docs` }),
      schema: docSchema,
    }),
  };
}

// Generate i18n collections for all languages
const i18nCollections = I18N_LANGUAGES.reduce((acc, lang) => {
  return { ...acc, ...createI18nCollections(lang) };
}, {} as Record<string, ReturnType<typeof defineCollection>>);

// Export collections
export const collections = {
  posts: postsCollection,
  pages: pagesCollection,
  projects: projectsCollection,
  docs: docsCollection,
  special: specialCollection,
  // Include all i18n collections
  ...i18nCollections,
};

// Export language list for use in routes
export { I18N_LANGUAGES };

