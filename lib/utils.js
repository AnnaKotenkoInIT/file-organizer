import fs from 'fs/promises';
import path from 'path';

// Format file size
export function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Draw console progress bar
export function drawProgressBar(current, total, width = 20) {
  if (total === 0) {
    return `${'░'.repeat(width)} 0/0`;
  }

  const percentage = current / total;
  const filled = Math.round(percentage * width);

  return (
    '█'.repeat(filled) + '░'.repeat(width - filled) + ` ${current}/${total}`
  );
}

// Get all files recursively
export async function getAllFiles(directory) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await walk(directory);

  return files;
}

const categories = {
  Documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xlsx', '.pptx'],
  Images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.bmp', '.webp'],
  Archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  Code: [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.html',
    '.css',
    '.json',
    '.py',
    '.java',
    '.cpp',
  ],
  Videos: ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
};

// Get file category
export function getCategory(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(extension)) {
      return category;
    }
  }

  return 'Other';
}

// Generate unique file name
export async function generateUniqueFileName(targetDirectory, fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);

  let candidate = fileName;
  let counter = 1;

  while (true) {
    try {
      await fs.access(path.join(targetDirectory, candidate));

      candidate = `${baseName}(${counter})${extension}`;
      counter++;
    } catch {
      return candidate;
    }
  }
}
