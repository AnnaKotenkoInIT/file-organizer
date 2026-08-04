import Scanner from './lib/scanner.js';
import DuplicateFinder from './lib/duplicates.js';
import Organizer from './lib/organizer.js';
import Cleanup from './lib/cleanup.js';

import { formatSize, drawProgressBar } from './lib/utils.js';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case 'scan':
        await runScan();
        break;

      case 'duplicates':
        await runDuplicates();
        break;

      case 'organize':
        await runOrganize();
        break;

      case 'cleanup':
        await runCleanup();
        break;

      default:
        printHelp();
    }
  } catch (error) {
    console.error('❌', error.message);
  }
}

async function runScan() {
  const directory = args[1];

  if (!directory) {
    return console.log('Please specify directory.');
  }

  const scanner = new Scanner();

  scanner.on('scan-start', (dir) => {
    console.log(`\nScanning: ${dir}\n`);
  });

  scanner.on('file-found', ({ current, total }) => {
    process.stdout.write('\r' + drawProgressBar(current, total));
  });

  scanner.on('scan-complete', (stats) => {
    console.log('\n\nScan completed\n');

    console.log(`Files: ${stats.totalFiles}`);
    console.log(`Size : ${formatSize(stats.totalSize)}`);

    console.log('\nFile types:');

    for (const [type, value] of stats.typeStats) {
      console.log(
        `${type} -> ${value.count} files (${formatSize(value.totalSize)})`,
      );
    }
  });

  await scanner.scan(directory);
}

async function runDuplicates() {
  const directory = args[1];

  if (!directory) {
    return console.log('Please specify directory.');
  }

  const finder = new DuplicateFinder();

  finder.on('file-processed', ({ current, total }) => {
    process.stdout.write('\r' + drawProgressBar(current, total));
  });

  finder.on('duplicates-found', (result) => {
    console.log('\n');

    console.log(`Duplicate groups: ${result.totalGroups}`);
    console.log(`Wasted space: ${formatSize(result.totalWastedSpace)}`);

    for (const group of result.groups) {
      console.log('\nHash:', group.hash);

      for (const file of group.files) {
        console.log('  ', file);
      }
    }
  });

  await finder.find(directory);
}

async function runOrganize() {
  const source = args[1];
  const outputIndex = args.indexOf('--output');

  if (!source || outputIndex === -1) {
    return console.log('Usage: organize <source> --output <directory>');
  }

  const output = args[outputIndex + 1];

  const organizer = new Organizer();

  organizer.on('file-copied', ({ current, total }) => {
    process.stdout.write('\r' + drawProgressBar(current, total));
  });

  organizer.on('organize-complete', (stats) => {
    console.log('\n');

    console.log(`Copied : ${stats.copiedFiles}`);
    console.log(`Failed : ${stats.failedFiles}`);
    console.log(`Size   : ${formatSize(stats.totalSize)}`);

    console.log('\nCategories:');

    for (const [category, count] of stats.categories) {
      console.log(`${category}: ${count}`);
    }
  });

  await organizer.organize(source, output);
}

async function runCleanup() {
  const directory = args[1];

  const daysIndex = args.indexOf('--older-than');

  if (!directory || daysIndex === -1) {
    return console.log(
      'Usage: cleanup <directory> --older-than <days> [--confirm]',
    );
  }

  const days = Number(args[daysIndex + 1]);

  const confirm = args.includes('--confirm');

  const cleanup = new Cleanup();

  cleanup.on('file-deleted', ({ current, total }) => {
    process.stdout.write('\r' + drawProgressBar(current, total));
  });

  cleanup.on('cleanup-complete', (stats) => {
    console.log('\n');

    console.log(`Deleted: ${stats.deleted}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Freed  : ${formatSize(stats.freedSpace)}`);
  });

  await cleanup.clean(directory, days, confirm);
}

function printHelp() {
  console.log(`
Available commands:

scan <directory>

duplicates <directory>

organize <source> --output <directory>

cleanup <directory> --older-than <days>

cleanup <directory> --older-than <days> --confirm
`);
}

main();
