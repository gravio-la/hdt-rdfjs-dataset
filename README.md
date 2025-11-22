# @graviola/hdt-rdfjs-dataset

> RDF/JS DatasetCore implementation backed by HDT (Header Dictionary Triples) with WASM64 for high-performance, compressed RDF storage in the browser.

[![npm version](https://img.shields.io/npm/v/@graviola/hdt-rdfjs-dataset.svg)](https://www.npmjs.com/package/@graviola/hdt-rdfjs-dataset)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **RDF/JS Compatible** - Full DatasetCore interface implementation  
✅ **Compressed Storage** - Built on [hdt-rs](https://github.com/KonradHoeffner/hdt) for efficient RDF compression  
✅ **Zero Regex Parsing** - Structured term data directly from Rust  
✅ **Browser-Native** - WASM64 compiled from Rust  
✅ **Clownface Ready** - Works seamlessly with Clownface graph traversal  
✅ **Type-Safe** - Full TypeScript definitions included  
✅ **Lightweight** - Minimal dependencies, tree-shakeable

## What is HDT?

[HDT (Header Dictionary Triples)](http://www.rdfhdt.org/) is a binary RDF serialization format that provides:

- **Compression**: 10-15x smaller than N-Triples
- **Query Performance**: Indexed structure enables fast pattern matching
- **Memory Efficiency**: Direct querying without full decompression
- **Read-Only Optimization**: Perfect for static RDF datasets

## Installation

```bash
npm install @graviola/hdt-rdfjs-dataset
# or
bun add @graviola/hdt-rdfjs-dataset
# or
yarn add @graviola/hdt-rdfjs-dataset
```

## Quick Start

### Basic Usage

```typescript
import { loadHdtDatasetFromUrl } from '@graviola/hdt-rdfjs-dataset';

// Load HDT file from URL
const dataset = await loadHdtDatasetFromUrl('https://example.org/data.hdt');

// Use as standard RDF/JS Dataset
console.log(`Dataset contains ${dataset.size} triples`);

// Iterate over all quads
for (const quad of dataset) {
  console.log(
    quad.subject.value,
    quad.predicate.value,
    quad.object.value
  );
}
```

### Pattern Matching

```typescript
import factory from '@rdfjs/data-model';

const rdfs = {
  label: factory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
};

// Find all triples with rdfs:label predicate
const matches = dataset.match(null, rdfs.label, null);

console.log(`Found ${matches.size} labels`);

for (const quad of matches) {
  console.log(`${quad.subject.value} has label: ${quad.object.value}`);
}
```

### With Clownface

```typescript
import clownface from 'clownface';
import factory from '@rdfjs/data-model';

// Create Clownface instance
const cf = clownface({ dataset });

// Fluent graph navigation
const person = cf.node(factory.namedNode('http://example.org/alice'));

// Get all labels
const labels = person.out(rdfs.label).values;

// Traverse relationships
const friends = person.out(foaf.knows);
for (const friend of friends.values) {
  const friendName = cf.node(factory.namedNode(friend))
    .out(foaf.name)
    .value;
  console.log(`Friend: ${friendName}`);
}
```

### Loading from Bytes

```typescript
import { loadHdtDataset } from '@graviola/hdt-rdfjs-dataset';

// Load from local file or fetch
const response = await fetch('/data.hdt');
const hdtBytes = new Uint8Array(await response.arrayBuffer());

const dataset = await loadHdtDataset(hdtBytes);
```

### Advanced: Raw Query API

For maximum performance, bypass RDF/JS term conversion:

```typescript
// Query returns structured terms directly from Rust
const results = dataset.queryRaw(
  'http://example.org/subject',
  null,
  null
);

// Results contain structured term data
for (const triple of results) {
  console.log(triple.subject.termType); // 'NamedNode'
  console.log(triple.object.language); // 'en' (if literal with language)
}
```

## API Reference

### Functions

#### `loadHdtDataset(hdtData, options?)`

Load an HDT dataset from bytes.

**Parameters:**
- `hdtData: Uint8Array` - HDT file data
- `options?: HdtLoadOptions` - Load options

**Returns:** `Promise<HdtDataset>`

#### `loadHdtDatasetFromUrl(url, options?)`

Load an HDT dataset from a URL.

**Parameters:**
- `url: string` - URL to HDT file
- `options?: HdtLoadOptions` - Load options

**Returns:** `Promise<HdtDataset>`

### HdtLoadOptions

```typescript
interface HdtLoadOptions {
  wasmSource?: string | Uint8Array; // Custom WASM binary
  initialMemory?: number;            // Initial memory pages (default: 256)
  maxMemory?: number;                // Max memory pages (default: 32768)
}
```

### HdtDataset Interface

Extends `RDF.DatasetCore` with additional methods:

```typescript
interface HdtDataset extends RDF.DatasetCore {
  // Standard RDF/JS DatasetCore
  size: number;
  add(quad: Quad): this;           // Throws (read-only)
  delete(quad: Quad): this;        // Throws (read-only)
  has(quad: Quad): boolean;
  match(s?, p?, o?, g?): DatasetCore;
  [Symbol.iterator](): Iterator<Quad>;
  
  // HDT-specific extensions
  queryRaw(s?: string, p?: string, o?: string): StructuredTriple[];
  sizeInBytes(): number;
  close(): void;
}
```

## Browser Support

Requires WASM64 support:

- ✅ Chrome 133+
- ✅ Firefox 134+ (with `javascript.options.wasm_memory64` enabled)
- ✅ Edge 133+
- ⚠️ Safari - Not yet supported
- ❌ Node.js - WASM64 not yet supported (use browser or Deno)

## Performance Characteristics

This library is built on [hdt-rs](https://github.com/KonradHoeffner/hdt), a Rust implementation of the HDT format, compiled to WASM64 for browser use.

### Key Benefits

- **Compression**: HDT files are typically 10-15x smaller than N-Triples
- **Indexed Queries**: Pattern queries use HDT's built-in indices for fast lookups
- **Memory Efficient**: No full decompression needed - queries operate directly on compressed data
- **Zero Regex**: Term parsing happens in Rust, returning structured data to JavaScript

## Limitations

1. **Read-Only**: HDT doesn't support mutations
   - `add()` and `delete()` throw errors
   - Ideal for static reference datasets

2. **Default Graph Only**: HDT doesn't support named graphs
   - All quads use default graph
   - Perfect for RDF triples

3. **Browser-Only**: Requires WASM64 support
   - Node.js support pending WASM64 implementation

## Package Structure

```
@graviola/hdt-rdfjs-dataset/
├── wasm/
│   └── hdt.wasm          # Prebuilt WASM binary (version controlled)
├── dist/                  # Built output (generated, not in git)
│   ├── index.js          # ESM bundle
│   ├── index.cjs         # CommonJS bundle
│   ├── *.d.ts            # TypeScript declarations
│   └── hdt.wasm          # Copied from wasm/ during build
└── src/                   # TypeScript source
```

The prebuilt WASM binary in `wasm/` is version controlled for easy publishing. In the future, WASM compilation will be integrated into the build pipeline.

## Creating HDT Files

Use the [HDT-it tool](https://github.com/rdfhdt/hdt-it) or [HDT-CPP](https://github.com/rdfhdt/hdt-cpp):

```bash
# Install hdt-cpp
sudo apt-get install hdt-cpp

# Convert N-Triples to HDT
rdf2hdt data.nt data.hdt

# Or from Turtle
rapper -i turtle data.ttl | rdf2hdt - data.hdt
```

## Examples

### Complete Clownface Example

```typescript
import { loadHdtDatasetFromUrl } from '@graviola/hdt-rdfjs-dataset';
import clownface from 'clownface';
import factory from '@rdfjs/data-model';

const dataset = await loadHdtDatasetFromUrl('/ontology.hdt');
const cf = clownface({ dataset });

const rdfs = {
  label: factory.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
  subClassOf: factory.namedNode('http://www.w3.org/2000/01/rdf-schema#subClassOf'),
};

// Find all classes with labels
const classes = cf.has(rdfs.label);

for (const classIri of classes.values) {
  const classNode = cf.node(factory.namedNode(classIri));
  const label = classNode.out(rdfs.label).value;
  const superClasses = classNode.out(rdfs.subClassOf).values;
  
  console.log(`Class: ${label}`);
  console.log(`Superclasses: ${superClasses.join(', ')}`);
}
```

### React Hook

```typescript
import { loadHdtDatasetFromUrl } from '@graviola/hdt-rdfjs-dataset';
import { useState, useEffect } from 'react';

export function useHdtDataset(url: string) {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHdtDatasetFromUrl(url)
      .then(setDataset)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { dataset, loading, error };
}
```


## License

MIT © Graviola Team

## Related Projects

- [hdt-rs](https://github.com/KonradHoeffner/hdt) - Rust HDT implementation (the core of this library)
- [hdt-cpp](https://github.com/rdfhdt/hdt-cpp) - Original HDT C++ implementation
- [hdt-java](https://github.com/rdfhdt/hdt-java) - HDT Java implementation  
- [RDF/JS](https://rdf.js.org/) - JavaScript RDF specifications
- [Clownface](https://github.com/rdf-ext/clownface) - Fluent RDF graph traversal
- [HDT specification](http://www.rdfhdt.org/) - Official HDT format documentation

## Acknowledgments

This library is built on [hdt-rs](https://github.com/KonradHoeffner/hdt) by Konrad Höffner, a pure Rust implementation of the HDT format. We've compiled it to WASM64 and wrapped it with a TypeScript RDF/JS DatasetCore interface to make HDT accessible in modern JavaScript applications.


