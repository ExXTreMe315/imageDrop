# ImageDrop

A minimal image upload and share platform built with Nuxt 4, TypeScript, and Tailwind CSS.

## Repository
[GitHub Repository](https://github.com/exxtreme315/imagedrop)

## Features

- **Upload** images via click-to-select, whole-page drag & drop, or paste (Ctrl+V)
- **Auto-copy** the image URL to clipboard after upload
- **Share** via the generated URL (`/imageUUID/filename.ext`)

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Production

```bash
pnpm build
node .output/server/index.mjs
```

## Stack

- Nuxt 4.4.2
- TypeScript
- Tailwind CSS v4
- pnpm
