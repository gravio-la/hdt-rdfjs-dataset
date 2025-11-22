/**
 * Type definitions for HDT RDF/JS Dataset
 */

import type * as RDF from '@rdfjs/types';

/**
 * Structured RDF term from Rust WASM with type discrimination
 */
export type StructuredRdfTerm =
  | {
      termType: 'NamedNode';
      value: string;
    }
  | {
      termType: 'BlankNode';
      value: string;
    }
  | {
      termType: 'Literal';
      value: string;
      language?: string;
      datatype?: string;
    };

/**
 * Structured triple from Rust WASM
 */
export interface StructuredTriple {
  subject: StructuredRdfTerm;
  predicate: StructuredRdfTerm;
  object: StructuredRdfTerm;
}

/**
 * WASM module exports interface
 */
export interface HdtWasmExports {
  memory: WebAssembly.Memory;
  hdt_alloc: (size: bigint) => bigint;
  hdt_free: (ptr: bigint, size: bigint) => void;
  hdt_load: (ptr: bigint, len: bigint) => number;
  hdt_query_triples: (
    subjectPtr: bigint,
    subjectLen: bigint,
    predicatePtr: bigint,
    predicateLen: bigint,
    objectPtr: bigint,
    objectLen: bigint,
    outputPtr: bigint,
    outputCapacity: bigint
  ) => number;
  hdt_count_triples: (
    subjectPtr: bigint,
    subjectLen: bigint,
    predicatePtr: bigint,
    predicateLen: bigint,
    objectPtr: bigint,
    objectLen: bigint
  ) => bigint;
  hdt_size_in_bytes: () => number;
  hdt_get_last_error?: (outputPtr: bigint, outputCapacity: bigint) => number;
  hdt_init_logging?: () => number;
  hdt_get_debug_log?: (outputPtr: bigint, outputCapacity: bigint) => number;
  hdt_clear_debug_log?: () => void;
}

/**
 * Options for loading HDT dataset
 */
export interface HdtLoadOptions {
  /**
   * Custom WASM binary URL or Uint8Array
   * If not provided, loads from the bundled hdt.wasm
   */
  wasmSource?: string | Uint8Array;
}

/**
 * HDT Dataset instance
 */
export interface HdtDataset extends RDF.DatasetCore {
  /**
   * Query triples directly from HDT (bypasses RDF/JS conversion)
   * @returns Array of structured triples
   */
  queryRaw(
    subject?: string | null,
    predicate?: string | null,
    object?: string | null
  ): StructuredTriple[];

  /**
   * Get the size of the HDT instance in memory (bytes)
   */
  sizeInBytes(): number;

  /**
   * Count triples matching a pattern (efficient, doesn't load into memory)
   */
  countMatches(
    subject?: RDF.Quad_Subject | null,
    predicate?: RDF.Quad_Predicate | null,
    object?: RDF.Quad_Object | null
  ): number;

  /**
   * Close and cleanup the HDT instance
   */
  close(): void;
}

