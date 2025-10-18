# Architecture Documentation

This document describes the internal architecture of `soroban-trace`.

## Overview

`soroban-trace` is built with a modular architecture that separates concerns into distinct layers:

```
┌─────────────────────────────────────────────────┐
│               User Interface Layer               │
│  ┌────────────┐              ┌───────────────┐  │
│  │  CLI       │              │  Library API  │  │
│  │  (cli.ts)  │              │  (index.ts)   │  │
│  └────────────┘              └───────────────┘  │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Data Fetching Layer                 │
│  ┌──────────────────────────────────────────┐   │
│  │  RPC Client (rpc-client.ts)              │   │
│  │  - Soroban RPC integration               │   │
│  │  - Horizon API fallback                  │   │
│  │  - Network configuration                 │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Parsing Layer                       │
│  ┌──────────────────────────────────────────┐   │
│  │  Parser (parser.ts)                      │   │
│  │  - XDR decoding                          │   │
│  │  - Transaction result extraction         │   │
│  │  - Operation parsing                     │   │
│  │  - Event extraction                      │   │
│  │  - Storage change detection              │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Formatting Layer                    │
│  ┌──────────────────────────────────────────┐   │
│  │  Formatter (formatter.ts)                │   │
│  │  - CLI tree rendering                    │   │
│  │  - JSON serialization                    │   │
│  │  - Color coding                          │   │
│  │  - Verbose/compact modes                 │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI (`cli.ts`)
Command-line interface entry point using Commander.js

### 2. Library API (`index.ts`)
Programmatic interface for Node.js/TypeScript projects

### 3. RPC Client (`rpc-client.ts`)
Fetches transaction data from Stellar network with automatic fallback

### 4. Parser (`parser.ts`)
Parses and decodes Soroban transaction XDR data

### 5. Formatter (`formatter.ts`)
Renders transaction traces in human-readable format

### 6. Types (`types.ts`)
TypeScript type definitions for all components

## Data Flow

```
User Command → CLI → Library → RPC Client → Parser → Formatter → Output
```

## Extension Points

The architecture supports:
- New output formats (HTML, Markdown, etc.)
- WASM metadata parsing
- Live tracing
- Analytics and metrics

For detailed technical information, see the inline code documentation.

