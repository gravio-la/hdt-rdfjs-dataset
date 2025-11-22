# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-22

### Added
- `countMatches()` method for memory-efficient pattern counting
- `hdt_count_triples` WASM function for O(1) space complexity counting
- Support for efficient triple counting without materializing results

### Fixed
- **Critical:** Fixed memory allocation issue where WASM memory was incorrectly imported instead of using exported memory
- **Critical:** Fixed memory exhaustion when accessing `dataset.size` on large datasets
- **Critical:** Fixed memory exhaustion when counting instances in class discovery
- Fixed BigInt conversion issues in `sizeInBytes()` for WASM64
- Optimized `dataset.size` getter to use efficient counting instead of loading all triples

### Changed
- WASM module now uses its own exported memory (WASM64 standard)
- Removed unused `initialMemory` and `maxMemory` options from `HdtLoadOptions`
- Dataset statistics and class discovery now use streaming/counting approach

### Performance
- Statistics loading no longer materializes all triples

## [0.1.0] - 2025-11-22

### Added
- Initial release of `@graviola/hdt-rdfjs-dataset`
- Full RDF/JS DatasetCore interface implementation
- HDT WASM64 backend for compressed RDF storage
- Structured term data from Rust (zero regex parsing)
- TypeScript definitions and full type safety
- `loadHdtDataset()` function for loading from bytes
- `loadHdtDatasetFromUrl()` helper function
- `queryRaw()` method for direct structured term access
- `sizeInBytes()` method for memory usage reporting
- Clownface compatibility
- Comprehensive README with examples
- GitHub Actions workflow for NPM publishing
- MIT License

### Performance
- 10-15x compression vs N-Triples
- O(log n) pattern queries via HDT indices
- Zero-copy structured term parsing
- Optimized WASM64 memory access

[0.2.0]: https://github.com/gravio-la/hdt-rdfjs-dataset/releases/tag/v0.2.0
[0.1.0]: https://github.com/gravio-la/hdt-rdfjs-dataset/releases/tag/v0.1.0

