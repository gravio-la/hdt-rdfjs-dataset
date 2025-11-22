/**
 * WASM module loader for HDT
 */

import type { HdtWasmExports, HdtLoadOptions, StructuredTriple } from './types.js';

/**
 * HDT WASM instance wrapper
 */
export class HdtWasm {
  private exports: HdtWasmExports | null = null;
  private memory: WebAssembly.Memory | null = null;
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  /**
   * Load and initialize the WASM module
   */
  async load(options: HdtLoadOptions = {}): Promise<void> {
    const { wasmSource, initialMemory = 256, maxMemory = 32768 } = options;

    // Load WASM bytes
    let wasmBytes: Uint8Array;
    if (wasmSource instanceof Uint8Array) {
      wasmBytes = wasmSource;
    } else if (typeof wasmSource === 'string') {
      const response = await fetch(wasmSource);
      if (!response.ok) {
        throw new Error(`Failed to load WASM from ${wasmSource}: ${response.statusText}`);
      }
      wasmBytes = new Uint8Array(await response.arrayBuffer());
    } else {
      // Load bundled WASM
      // @ts-ignore - This will be resolved at build time
      const wasmUrl = new URL('../dist/hdt.wasm', import.meta.url);
      const response = await fetch(wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to load bundled WASM: ${response.statusText}`);
      }
      wasmBytes = new Uint8Array(await response.arrayBuffer());
    }

    // Compile WASM
    const module = await WebAssembly.compile(wasmBytes);

    // Create memory with i64 index support (WASM64)
    this.memory = new WebAssembly.Memory({
      initial: initialMemory,
      maximum: maxMemory,
      // @ts-ignore - index property is not in TS types yet but required for WASM64
      index: 'i64',
    });

    // Instantiate WASM
    const instance = await WebAssembly.instantiate(module, {
      env: {
        memory: this.memory,
      },
    });

    this.exports = instance.exports as HdtWasmExports;

    // Initialize Rust logger if available
    if (this.exports.hdt_init_logging) {
      this.exports.hdt_init_logging();
    }
  }

  /**
   * Load HDT data
   */
  loadHdt(data: Uint8Array): void {
    if (!this.exports || !this.memory) {
      throw new Error('WASM not loaded. Call load() first.');
    }

    // Allocate memory
    const ptr = this.exports.hdt_alloc(BigInt(data.length));
    if (!ptr) {
      throw new Error('Failed to allocate memory');
    }

    // Copy data to WASM memory
    const memoryView = new Uint8Array(this.memory.buffer);
    memoryView.set(data, Number(ptr));

    // Call load function
    const result = this.exports.hdt_load(ptr, BigInt(data.length));

    // Free input buffer
    this.exports.hdt_free(ptr, BigInt(data.length));

    if (result !== 0) {
      const errorMsg = this.getLastError();
      throw new Error(`Failed to load HDT: ${errorMsg || `Error code ${result}`}`);
    }
  }

  /**
   * Query triples
   */
  queryTriples(
    subject?: string | null,
    predicate?: string | null,
    object?: string | null
  ): StructuredTriple[] {
    if (!this.exports || !this.memory) {
      throw new Error('WASM not loaded');
    }

    // Prepare input strings
    const subjectBytes = subject ? this.textEncoder.encode(subject) : new Uint8Array(0);
    const predicateBytes = predicate ? this.textEncoder.encode(predicate) : new Uint8Array(0);
    const objectBytes = object ? this.textEncoder.encode(object) : new Uint8Array(0);

    // Allocate memory for inputs
    const subjectPtr = subject ? this.exports.hdt_alloc(BigInt(subjectBytes.length)) : 0n;
    const predicatePtr = predicate ? this.exports.hdt_alloc(BigInt(predicateBytes.length)) : 0n;
    const objectPtr = object ? this.exports.hdt_alloc(BigInt(objectBytes.length)) : 0n;

    // Copy input strings to WASM memory
    const memoryView = new Uint8Array(this.memory.buffer);
    if (subject) memoryView.set(subjectBytes, Number(subjectPtr));
    if (predicate) memoryView.set(predicateBytes, Number(predicatePtr));
    if (object) memoryView.set(objectBytes, Number(objectPtr));

    // Allocate output buffer (1MB)
    const outputCapacity = 1024 * 1024;
    const outputPtr = this.exports.hdt_alloc(BigInt(outputCapacity));

    // Call query function
    const resultLen = this.exports.hdt_query_triples(
      subjectPtr,
      BigInt(subjectBytes.length),
      predicatePtr,
      BigInt(predicateBytes.length),
      objectPtr,
      BigInt(objectBytes.length),
      outputPtr,
      BigInt(outputCapacity)
    );

    // Free input buffers
    if (subject) this.exports.hdt_free(subjectPtr, BigInt(subjectBytes.length));
    if (predicate) this.exports.hdt_free(predicatePtr, BigInt(predicateBytes.length));
    if (object) this.exports.hdt_free(objectPtr, BigInt(objectBytes.length));

    if (resultLen < 0) {
      this.exports.hdt_free(outputPtr, BigInt(outputCapacity));
      throw new Error(`Query failed with code: ${resultLen}`);
    }

    // Read result JSON
    const resultBytes = new Uint8Array(this.memory.buffer, Number(outputPtr), Number(resultLen));
    const resultJson = this.textDecoder.decode(resultBytes);

    // Free output buffer
    this.exports.hdt_free(outputPtr, BigInt(outputCapacity));

    // Parse and return results
    return JSON.parse(resultJson) as StructuredTriple[];
  }

  /**
   * Get the size of the HDT instance in memory
   */
  sizeInBytes(): number {
    if (!this.exports) {
      throw new Error('WASM not loaded');
    }
    return this.exports.hdt_size_in_bytes();
  }

  /**
   * Get last error message from Rust
   */
  private getLastError(): string {
    if (!this.exports || !this.exports.hdt_get_last_error || !this.memory) {
      return '';
    }

    const errorBufferCapacity = 1024;
    const errorPtr = this.exports.hdt_alloc(BigInt(errorBufferCapacity));
    const errorLen = this.exports.hdt_get_last_error(errorPtr, BigInt(errorBufferCapacity));

    let errorMsg = '';
    if (errorLen > 0) {
      const errorBytes = new Uint8Array(this.memory.buffer, Number(errorPtr), Number(errorLen));
      errorMsg = this.textDecoder.decode(errorBytes);
    }

    this.exports.hdt_free(errorPtr, BigInt(errorBufferCapacity));
    return errorMsg;
  }

  /**
   * Check if WASM is loaded
   */
  isLoaded(): boolean {
    return this.exports !== null && this.memory !== null;
  }
}

