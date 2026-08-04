import fs from 'fs';
import crypto from 'crypto';
import { EventEmitter } from 'events';

import { getAllFiles } from './utils.js';

// Duplicate finder
export default class DuplicateFinder extends EventEmitter {
  constructor() {
    super();
  }

  async find(directory) {
    this.emit('search-start', directory);

    const filePaths = await getAllFiles(directory);

    const hashes = new Map();

    let processed = 0;

    for (const filePath of filePaths) {
      const hash = await this.calculateHash(filePath);

      if (!hashes.has(hash)) {
        hashes.set(hash, []);
      }

      hashes.get(hash).push(filePath);

      processed++;

      this.emit('file-processed', {
        current: processed,
        total: filePaths.length,
        file: filePath,
      });
    }

    const duplicates = this.buildDuplicateGroups(hashes);

    this.emit('duplicates-found', duplicates);

    return duplicates;
  }

  // Calculate SHA-256 hash
  calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');

      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Build duplicate groups
  buildDuplicateGroups(hashes) {
    const groups = [];

    let totalWastedSpace = 0;

    for (const [hash, files] of hashes.entries()) {
      if (files.length < 2) {
        continue;
      }

      const size = fs.statSync(files[0]).size;

      const wastedSpace = size * (files.length - 1);

      totalWastedSpace += wastedSpace;

      groups.push({
        hash,
        files,
        copies: files.length,
        fileSize: size,
        wastedSpace,
      });
    }

    return {
      groups,
      totalGroups: groups.length,
      totalWastedSpace,
    };
  }
}
