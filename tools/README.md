# Offline REA helpers (no Ghidra needed)

The `rea` MCP tools are only registered at agent-session start; when they are missing these
scripts read the shipped TVPaint binary directly.

- `pe-xref.js <exe> <string> ...` — find ASCII/UTF-16 strings and every RIP-relative `lea`
  that references them (validated against known TVPaint addresses).
- `pe-func.js <exe> <va> ...` — resolve the enclosing x64 function from `.pdata`.
- `pe-disasm.js <exe> <va> <len> [--bytes]` — disassemble a VA range.

Setup (only for pe-disasm): `npm install iced-x86` in this folder.

Example:

```
node pe-xref.js "TVPaint Animation 12 Pro Demo.exe" timestretch pingpong
node pe-func.js "TVPaint Animation 12 Pro Demo.exe" 0x140413ab0
node pe-disasm.js "TVPaint Animation 12 Pro Demo.exe" 0x140413ab0 820 --bytes
```
