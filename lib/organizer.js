import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { EventEmitter } from 'events';

import { getAllFiles, getCategory, generateUniqueFileName } from './utils.js';

export default class Organizer extends EventEmitter {
  constructor() {
    super();
  }

  async organize(sourceDir, outputDir) {
    this.emit('organize-start', { sourceDir, outputDir });

    await fsp.mkdir(outputDir, { recursive: true });

    const files = await getAllFiles(sourceDir);

    const stats = {
      totalFiles: files.length,
      copiedFiles: 0,
      failedFiles: 0,
      totalSize: 0,
      categories: new Map(),
    };

    let current = 0;

    for (const file of files) {
      current++;

      try {
        const info = await fsp.stat(file);

        stats.totalSize += info.size;

        const category = getCategory(file);

        await this.copyFile(file, outputDir, category);

        stats.categories.set(
          category,
          (stats.categories.get(category) || 0) + 1,
        );

        stats.copiedFiles++;
      } catch (error) {
        stats.failedFiles++;

        this.emit('copy-error', {
          file,
          error,
        });
      }

      this.emit('file-copied', {
        current,
        total: files.length,
        file,
      });
    }

    this.emit('organize-complete', stats);

    return stats;
  }

  async copyFile(filePath, outputDir, category) {
    const targetDir = path.join(outputDir, category);

    await fsp.mkdir(targetDir, {
      recursive: true,
    });

    const fileName = await generateUniqueFileName(
      targetDir,
      path.basename(filePath),
    );

    await pipeline(
      fs.createReadStream(filePath),
      fs.createWriteStream(path.join(targetDir, fileName)),
    );
  }
}
