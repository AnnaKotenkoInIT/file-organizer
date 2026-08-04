# File Organizer CLI

A command-line application built with **Node.js** for scanning, organizing, finding duplicate files, and cleaning up directories.

## Features:

- Scan directories recursively
- Display file statistics
- Find duplicate files using SHA-256 hash
- Organize files by category
- Delete old files
- Show progress while processing files
- Event-driven architecture using EventEmitter

---

## Requirements

- Node.js 20+ (LTS recommended)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/AnnaKotenkoInIT/file-organizer.git
```

Open the project:

```bash
cd file-organizer
```

Install dependencies:

```bash
npm install
```

---

## Project Structure

```
file-organizer/
│
├── file-organizer.js
├── package.json
├── README.md
│
└── lib/
    ├── cleanup.js
    ├── duplicates.js
    ├── organizer.js
    ├── scanner.js
    └── utils.js
```

---

## Available Commands

### Scan directory

```bash
npm run scan -- ./test
```

### Find duplicate files

```bash
npm run duplicates -- ./test
```

### Organize files

```bash
npm run organize -- ./test --output ./organized
```

### Cleanup (preview)

```bash
npm run cleanup -- ./test --older-than 90
```

### Cleanup (delete files)

```bash
npm run cleanup -- ./test --older-than 90 --confirm
```

---

## Technologies

- Node.js
- ES Modules
- EventEmitter
- Streams
- fs/promises
- Crypto API

---

## Author

Anna Kotenko
