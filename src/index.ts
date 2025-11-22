/**
 * @graviola/hdt-rdfjs-dataset
 * 
 * RDF/JS DatasetCore implementation backed by HDT (Header Dictionary Triples)
 * with WASM64 for high-performance, compressed RDF storage in the browser.
 * 
 * @packageDocumentation
 */

export { HdtWasm } from './wasm-loader.js';
export { HdtDatasetCore } from './dataset.js';
export type {
  HdtDataset,
  HdtLoadOptions,
  HdtWasmExports,
  StructuredRdfTerm,
  StructuredTriple,
} from './types.js';

import { HdtWasm } from './wasm-loader.js';
import { HdtDatasetCore } from './dataset.js';
import type { HdtLoadOptions } from './types.js';

/**
 * Load an HDT dataset from bytes
 * 
 * @example
 * ```typescript
 * import { loadHdtDataset } from '@graviola/hdt-rdfjs-dataset';
 * 
 * // Fetch and load HDT file
 * const response = await fetch('data.hdt');
 * const hdtBytes = new Uint8Array(await response.arrayBuffer());
 * const dataset = await loadHdtDataset(hdtBytes);
 * 
 * // Use as RDF/JS Dataset
 * console.log(`Dataset size: ${dataset.size}`);
 * for (const quad of dataset) {
 *   console.log(quad.subject.value, quad.predicate.value, quad.object.value);
 * }
 * 
 * // Query with pattern
 * const matches = dataset.match(
 *   factory.namedNode('http://example.org/subject'),
 *   null,
 *   null
 * );
 * ```
 * 
 * @param hdtData - HDT file as Uint8Array
 * @param options - Load options
 * @returns Promise resolving to HdtDataset instance
 */
export async function loadHdtDataset(
  hdtData: Uint8Array,
  options?: HdtLoadOptions
): Promise<HdtDatasetCore> {
  const wasm = new HdtWasm();
  await wasm.load(options);
  wasm.loadHdt(hdtData);
  return new HdtDatasetCore(wasm);
}

/**
 * Create an HDT dataset from a URL
 * 
 * @example
 * ```typescript
 * import { loadHdtDatasetFromUrl } from '@graviola/hdt-rdfjs-dataset';
 * 
 * const dataset = await loadHdtDatasetFromUrl('https://example.org/data.hdt');
 * ```
 * 
 * @param url - URL to HDT file
 * @param options - Load options
 * @returns Promise resolving to HdtDataset instance
 */
export async function loadHdtDatasetFromUrl(
  url: string,
  options?: HdtLoadOptions
): Promise<HdtDatasetCore> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch HDT from ${url}: ${response.statusText}`);
  }
  const hdtBytes = new Uint8Array(await response.arrayBuffer());
  return loadHdtDataset(hdtBytes, options);
}

