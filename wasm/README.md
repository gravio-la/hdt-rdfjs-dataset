# Prebuilt WASM Binary

This directory contains the prebuilt HDT WASM64 binary that is bundled with the package.

## Current Binary

- **File**: `hdt.wasm`
- **Size**: ~374 KB
- **Built**: 2025-11-22
- **Source**: [hdt-rs](https://github.com/KonradHoeffner/hdt) by Konrad Höffner
- **Target**: `wasm64-unknown-unknown`
- **Rust Version**: nightly-2025-11-21

## Build Process (Manual)

The WASM binary is currently built manually from the parent Rust project:

```bash
# From project root: hdt-wasm-experiment/
cd hdt
cargo build \
  --target wasm64-unknown-unknown \
  -Z build-std=std,panic_abort \
  --release \
  --features wasm \
  --lib

# Copy to package
cp target/wasm64-unknown-unknown/release/hdt.wasm \
   packages/hdt-rdfjs-dataset/wasm/
```

The project uses a modified version of the HDT library that is compatible with WASM64.
It will soon be published as a fork and hopefully reach the quality to upstream to the original HDT library.

## Future Integration

In the future, we plan to integrate WASM compilation directly into the build pipeline:

1. Add Rust toolchain setup to GitHub Actions
2. Build WASM as part of the package build process
3. Remove prebuilt binary from version control

## Version Control

✅ **This directory IS version controlled** - Contains prebuilt WASM for easy publishing

The `dist/` directory is NOT version controlled and is built by Rollup, which copies `wasm/hdt.wasm` → `dist/hdt.wasm`.

## Notes

- WASM64 requires nightly Rust with `rust-src` component
- Build uses `-Z build-std` for std library compilation
- Threading is disabled for WASM64 compatibility
- Binary includes structured RDF term serialization

