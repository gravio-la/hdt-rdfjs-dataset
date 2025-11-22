/**
 * RDF/JS DatasetCore implementation for HDT
 */

import type * as RDF from '@rdfjs/types';
import factory from '@rdfjs/data-model';
import type { HdtDataset, StructuredRdfTerm, StructuredTriple } from './types.js';
import type { HdtWasm } from './wasm-loader.js';

/**
 * Convert structured RDF term from Rust to RDF/JS term
 */
function structuredTermToRdfJs(term: StructuredRdfTerm): RDF.Term {
  switch (term.termType) {
    case 'NamedNode':
      return factory.namedNode(term.value);

    case 'BlankNode':
      // Remove "_:" prefix
      return factory.blankNode(term.value.substring(2));

    case 'Literal':
      if (term.language) {
        return factory.literal(term.value, term.language);
      } else if (term.datatype) {
        return factory.literal(term.value, factory.namedNode(term.datatype));
      } else {
        return factory.literal(term.value);
      }

    default:
      throw new Error(`Unknown term type: ${(term as any).termType}`);
  }
}

/**
 * Convert structured triple from Rust to RDF/JS Quad
 */
function structuredTripleToQuad(triple: StructuredTriple): RDF.Quad {
  return factory.quad(
    structuredTermToRdfJs(triple.subject) as RDF.Quad_Subject,
    structuredTermToRdfJs(triple.predicate) as RDF.Quad_Predicate,
    structuredTermToRdfJs(triple.object) as RDF.Quad_Object,
    factory.defaultGraph()
  );
}

/**
 * Match result wrapper
 */
class HdtMatchResult implements RDF.DatasetCore {
  constructor(private triples: StructuredTriple[]) {}

  get size(): number {
    return this.triples.length;
  }

  add(): this {
    throw new Error('HDT is read-only - cannot add quads');
  }

  delete(): this {
    throw new Error('HDT is read-only - cannot delete quads');
  }

  has(quad: RDF.Quad): boolean {
    for (const triple of this.triples) {
      if (
        triple.subject.value === quad.subject.value &&
        triple.predicate.value === quad.predicate.value &&
        triple.object.value === quad.object.value
      ) {
        return true;
      }
    }
    return false;
  }

  match(
    subject?: RDF.Quad_Subject | null,
    predicate?: RDF.Quad_Predicate | null,
    object?: RDF.Quad_Object | null,
    graph?: RDF.Quad_Graph | null
  ): RDF.DatasetCore {
    // Filter in-memory for nested matches
    if (graph && !graph.equals(factory.defaultGraph())) {
      return new HdtMatchResult([]);
    }

    const filtered = this.triples.filter((triple) => {
      if (subject && triple.subject.value !== subject.value) return false;
      if (predicate && triple.predicate.value !== predicate.value) return false;
      if (object && triple.object.value !== object.value) return false;
      return true;
    });

    return new HdtMatchResult(filtered);
  }

  *[Symbol.iterator](): Iterator<RDF.Quad> {
    for (const triple of this.triples) {
      yield structuredTripleToQuad(triple);
    }
  }
}

/**
 * HDT Dataset implementation
 */
export class HdtDatasetCore implements HdtDataset {
  private _size: number | null = null;

  constructor(private wasm: HdtWasm) {
    if (!wasm.isLoaded()) {
      throw new Error('WASM module must be loaded before creating dataset');
    }
  }

  get size(): number {
    if (this._size === null) {
      // Use efficient count function instead of loading all triples
      this._size = this.wasm.countTriples(null, null, null);
    }
    return this._size;
  }

  add(): this {
    throw new Error('HDT is read-only - cannot add quads');
  }

  delete(): this {
    throw new Error('HDT is read-only - cannot delete quads');
  }

  has(quad: RDF.Quad): boolean {
    const results = this.wasm.queryTriples(
      quad.subject?.value || null,
      quad.predicate?.value || null,
      quad.object?.value || null
    );

    // Check if any result exactly matches
    for (const triple of results) {
      if (
        triple.subject.value === quad.subject?.value &&
        triple.predicate.value === quad.predicate?.value &&
        triple.object.value === quad.object?.value
      ) {
        return true;
      }
    }
    return false;
  }

  match(
    subject?: RDF.Quad_Subject | null,
    predicate?: RDF.Quad_Predicate | null,
    object?: RDF.Quad_Object | null,
    graph?: RDF.Quad_Graph | null
  ): RDF.DatasetCore {
    // HDT doesn't support named graphs, only match default graph
    if (graph && !graph.equals(factory.defaultGraph())) {
      return new HdtMatchResult([]);
    }

    const s = subject?.value || null;
    const p = predicate?.value || null;
    const o = object?.value || null;

    const triples = this.wasm.queryTriples(s, p, o);

    return new HdtMatchResult(triples);
  }

  *[Symbol.iterator](): Iterator<RDF.Quad> {
    const triples = this.wasm.queryTriples(null, null, null);
    for (const triple of triples) {
      yield structuredTripleToQuad(triple);
    }
  }

  /**
   * Query triples directly (bypasses RDF/JS conversion)
   */
  queryRaw(
    subject?: string | null,
    predicate?: string | null,
    object?: string | null
  ): StructuredTriple[] {
    return this.wasm.queryTriples(subject, predicate, object);
  }

  /**
   * Get the size of the HDT instance in memory (bytes)
   */
  sizeInBytes(): number {
    return this.wasm.sizeInBytes();
  }

  /**
   * Close and cleanup (currently a no-op as WASM GC handles cleanup)
   */
  close(): void {
    // Future: could implement explicit HDT instance cleanup
    this._size = null;
  }

  /**
   * Count triples matching a pattern (efficient, doesn't load into memory)
   */
  countMatches(
    subject?: RDF.Quad_Subject | null,
    predicate?: RDF.Quad_Predicate | null,
    object?: RDF.Quad_Object | null
  ): number {
    const s = subject?.value || null;
    const p = predicate?.value || null;
    const o = object?.value || null;
    return this.wasm.countTriples(s, p, o);
  }
}

