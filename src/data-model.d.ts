/**
 * Type declarations for @rdfjs/data-model
 * This package doesn't ship with TypeScript types
 */

declare module '@rdfjs/data-model' {
  import type * as RDF from '@rdfjs/types';

  /**
   * Default export is a DataFactory instance
   */
  const factory: RDF.DataFactory;
  export default factory;
}

