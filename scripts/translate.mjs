#!/usr/bin/env node
/**
 * AI-powered content translation script using Claude API
 * Translates markdown content while preserving formatting, code blocks, and frontmatter structure
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const LANGUAGES = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  it: 'Italian',
  sv: 'Swedish'
};

const CONTENT_DIRS = ['posts', 'pages', 'projects', 'docs'];
const CONTENT_BASE = path.join(process.cwd(), 'src', 'content');
const TRANSLATION_BASE = path.join(process.cwd(), 'src', 'content-i18n'); // Outside Obsidian vault

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic();

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: '', body: content, raw: null };

  return {
    frontmatter: match[1],
    body: match[2],
    raw: match[0]
  };
}

/**
 * Reconstruct markdown with frontmatter
 */
function reconstructMarkdown(frontmatter, body) {
  return `---\n${frontmatter}\n---\n${body}`;
}

/**
 * Translate content using Claude API
 */
async function translateContent(content, targetLang, langCode, filePath) {
  const { frontmatter, body } = parseFrontmatter(content);

  const systemPrompt = `You are a professional translator. Translate the content to ${targetLang}.

CRITICAL RULES:
1. Preserve ALL markdown formatting exactly (headers, links, code blocks, lists, etc.)
2. DO NOT translate:
   - Code blocks (content between \`\`\` or \`)
   - URLs and file paths
   - Wikilinks like [[filename]] - keep the filename unchanged
   - Image references like ![[image.png]] or ![alt](path)
   - HTML tags
   - Property names in YAML (like "title:", "date:", "tags:")
3. DO translate:
   - The VALUES of title, description, imageAlt in frontmatter
   - All prose/paragraph text
   - List item text (but not if it's a tag or technical term)
4. Keep the same line breaks and spacing
5. For tags array in frontmatter, translate conceptual tags but keep technical ones (like "astro", "obsidian") unchanged
6. Maintain the author's tone and voice`;

  const userPrompt = `Translate this markdown content to ${targetLang}. Return ONLY the translated content, no explanations.

FRONTMATTER (translate title, description, imageAlt values only):
---
${frontmatter}
---

BODY (translate all prose):
${body}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    });

    const translated = response.content[0].text;

    // Extract frontmatter and body from response
    const parsed = parseFrontmatter(translated);
    if (parsed.frontmatter) {
      // Add language field to frontmatter
      const fmWithLang = parsed.frontmatter + `\nlang: ${langCode}`;
      return reconstructMarkdown(fmWithLang, parsed.body);
    }

    // If response didn't include frontmatter markers, reconstruct
    const fmWithLang = frontmatter + `\nlang: ${langCode}`;
    return reconstructMarkdown(fmWithLang, translated);

  } catch (error) {
    console.error(`  ✗ Translation failed for ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Get all markdown files from a directory recursively
 */
async function getMarkdownFiles(dir) {
  const files = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip attachments and hidden directories
        if (entry.name === 'attachments' || entry.name.startsWith('.')) continue;
        files.push(...await getMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist, skip
  }

  return files;
}

/**
 * Link or copy attachments directory if it exists
 * Tries symlink first (saves space), falls back to copy (Windows compatibility)
 */
async function linkAttachments(sourceDir, targetDir) {
  const sourceAttachments = path.join(sourceDir, 'attachments');
  const targetAttachments = path.join(targetDir, 'attachments');

  try {
    await fs.access(sourceAttachments);

    // Check if target already exists
    try {
      await fs.access(targetAttachments);
      return; // Already linked/copied
    } catch {
      // Target doesn't exist, proceed
    }

    // Try symlink first (saves disk space)
    try {
      await fs.symlink(sourceAttachments, targetAttachments, 'junction');
      console.log(`  ⤷ Linked attachments`);
    } catch {
      // Symlink failed (Windows without admin, etc.), fall back to copy
      await fs.cp(sourceAttachments, targetAttachments, { recursive: true });
      console.log(`  → Copied attachments`);
    }
  } catch {
    // No attachments directory, skip
  }
}

/**
 * Main translation workflow
 */
async function main() {
  const args = process.argv.slice(2);
  const targetLangs = args.length > 0 ? args : Object.keys(LANGUAGES);
  const dryRun = args.includes('--dry-run');

  console.log('🌐 Content Translation Script');
  console.log('═'.repeat(50));
  console.log(`Target languages: ${targetLangs.filter(l => l !== '--dry-run').join(', ')}`);
  console.log(`Content directories: ${CONTENT_DIRS.join(', ')}`);
  if (dryRun) console.log('DRY RUN - no files will be written\n');
  console.log();

  // Collect all files to translate
  const allFiles = [];
  for (const contentDir of CONTENT_DIRS) {
    const sourceDir = path.join(CONTENT_BASE, contentDir);
    const files = await getMarkdownFiles(sourceDir);
    allFiles.push(...files.map(f => ({ file: f, contentDir })));
  }

  console.log(`Found ${allFiles.length} files to translate\n`);

  // Process each language
  for (const langCode of targetLangs) {
    if (langCode === '--dry-run') continue;
    if (!LANGUAGES[langCode]) {
      console.log(`⚠ Unknown language code: ${langCode}, skipping`);
      continue;
    }

    const langName = LANGUAGES[langCode];
    console.log(`\n📝 Translating to ${langName} (${langCode})`);
    console.log('─'.repeat(40));

    for (const contentDir of CONTENT_DIRS) {
      const sourceDir = path.join(CONTENT_BASE, contentDir);
      const targetDir = path.join(TRANSLATION_BASE, langCode, contentDir);

      // Create target directory
      if (!dryRun) {
        await fs.mkdir(targetDir, { recursive: true });
        await linkAttachments(sourceDir, targetDir);
      }

      const files = allFiles.filter(f => f.contentDir === contentDir);

      for (const { file } of files) {
        const relativePath = path.relative(sourceDir, file);
        const targetFile = path.join(targetDir, relativePath);

        console.log(`  → ${relativePath}`);

        if (dryRun) continue;

        try {
          // Ensure target subdirectory exists
          await fs.mkdir(path.dirname(targetFile), { recursive: true });

          // Read, translate, write
          const content = await fs.readFile(file, 'utf-8');
          const translated = await translateContent(content, langName, langCode, relativePath);
          await fs.writeFile(targetFile, translated, 'utf-8');

          // Rate limiting - wait between API calls
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`    ✗ Failed: ${error.message}`);
        }
      }
    }
  }

  console.log('\n═'.repeat(50));
  console.log('✅ Translation complete!');
  console.log(`\nTranslations saved to: src/content-i18n/{lang}/`);
  console.log('  (Outside your Obsidian vault - won\'t pollute src/content/)');
  console.log('\nNext steps:');
  console.log('1. Review translated content in src/content-i18n/{lang}/ folders');
  console.log('2. Configure Astro to read from content-i18n (see astro.config.mjs)');
  console.log('3. Add language switcher to your theme');
}

main().catch(console.error);
