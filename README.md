# QR Code Generator

A React + TypeScript app for generating QR codes from a variety of payload types (URLs, Wi-Fi credentials, contact cards, etc.).

Built with Vite, Tailwind CSS v4, shadcn/ui (Radix primitives), and [`qrcode`](https://github.com/soldair/node-qrcode).

## Getting started

```bash
bun install
bun run dev
```

Then open the URL printed by Vite.

## Scripts

- `bun run dev` — start the Vite dev server
- `bun run build` — type-check and produce a production build
- `bun run preview` — preview the production build locally
- `bun run lint` — run ESLint

## Project structure

The code is organized into layers:

- `src/domain/qr` — payload encoders and domain model
- `src/application/qr` — use cases (encoding payloads, rendering QR images)
- `src/infrastructure/qr` — adapters around the `qrcode` library
- `src/features/qr-generator/ui` — React UI for the generator
- `src/components` — shared shadcn/ui components
