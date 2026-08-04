import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

import { getAllFiles } from './utils.js';

// Scanner class
export default class Scanner extends EventEmitter {
  constructor() {
    super();
  }

  async scan(directory) {
    this.emit('scan-start', directory);

    const filePaths = await getAllFiles(directory);

    const files = [];

    let processed = 0;

    for (const filePath of filePaths) {
      const stats = await fs.stat(filePath);

      const file = {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath).toLowerCase() || '(other)',
        size: stats.size,
        modified: stats.mtime,
      };

      files.push(file);

      processed++;

      this.emit('file-found', {
        current: processed,
        total: filePaths.length,
        file,
      });
    }

    const statistics = this.calculateStatistics(files);

    this.emit('scan-complete', statistics);

    return statistics;
  }

  // Calculate all statistics
  calculateStatistics(files) {
    const typeStats = new Map();

    let totalSize = 0;

    const age = {
      last7Days: 0,
      last30Days: 0,
      older90Days: 0,
    };

    const now = Date.now();

    for (const file of files) {
      totalSize += file.size;

      if (!typeStats.has(file.extension)) {
        typeStats.set(file.extension, {
          count: 0,
          totalSize: 0,
        });
      }

      const current = typeStats.get(file.extension);

      current.count++;
      current.totalSize += file.size;

      const diffDays = (now - file.modified.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) {
        age.last7Days++;
      }

      if (diffDays <= 30) {
        age.last30Days++;
      }

      if (diffDays > 90) {
        age.older90Days++;
      }
    }

    const largestFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 3);

    const oldestFile = [...files].sort((a, b) => a.modified - b.modified)[0];

    return {
      totalFiles: files.length,
      totalSize,
      typeStats,
      age,
      largestFiles,
      oldestFile,
    };
  }
}
