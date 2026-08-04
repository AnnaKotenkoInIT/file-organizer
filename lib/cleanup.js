import fsp from 'fs/promises';
import { EventEmitter } from 'events';

import { getAllFiles } from './utils.js';

export default class Cleanup extends EventEmitter {
  constructor() {
    super();
  }

  async clean(directory, olderThan, confirm = false) {
    this.emit('cleanup-start', { directory, olderThan, confirm });

    const files = await getAllFiles(directory);

    const stats = {
      scanned: files.length,
      deleted: 0,
      skipped: 0,
      freedSpace: 0,
    };

    const limit = Date.now() - olderThan * 24 * 60 * 60 * 1000;

    let current = 0;

    for (const file of files) {
      current++;

      try {
        const info = await fsp.stat(file);

        if (info.mtimeMs > limit) {
          stats.skipped++;

          this.emit('file-skipped', file);

          continue;
        }

        if (confirm) {
          await fsp.unlink(file);
        }

        stats.deleted++;
        stats.freedSpace += info.size;

        this.emit('file-deleted', {
          current,
          total: files.length,
          file,
        });
      } catch (error) {
        this.emit('cleanup-error', {
          file,
          error,
        });
      }
    }

    this.emit('cleanup-complete', stats);

    return stats;
  }
}
