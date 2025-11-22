# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/gravio-la/hdt-rdfjs-dataset/releases/tag/v0.1.0

