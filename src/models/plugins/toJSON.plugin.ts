/* eslint-disable no-param-reassign */
import type { Document, Schema, Types } from 'mongoose';

interface DocumentObject {
  _id?: Types.ObjectId;
  id?: string;
  __v?: unknown;
  [key: string]: unknown;
}

type TransformFunction = (doc: Document, ret: DocumentObject) => DocumentObject;

/**
 * Extended options for the toJSON plugin
 */
export interface ExtendedToJSONOptions {
  /** Custom transform function to apply after plugin transformations */
  transform?: TransformFunction;
  /** Whether to remove private paths (default: true) */
  removePrivatePaths?: boolean;
  /** Whether to remove the __v version field (default: true) */
  removeVersion?: boolean;
  /** Whether to normalize _id to id (default: true) */
  normalizeId?: boolean;
}

type SchemaWithOptions = Schema & {
  options?: {
    toJSON?: ExtendedToJSONOptions;
  };
};

const normalizeId = (ret: DocumentObject): void => {
  if (ret._id && typeof ret._id === 'object' && ret._id.toString && typeof ret.id === 'undefined') {
    ret.id = ret._id.toString();
  }
  if (ret._id !== undefined) delete ret._id;
};

const removePrivatePaths = (ret: DocumentObject, schema: Schema): void => {
  Object.keys(schema.paths).forEach((path) => {
    const pathOptions = schema.paths[path]?.options;
    if (!pathOptions?.private) return;

    const segments = path.split('.');
    let current: unknown = ret;

    for (let i = 0; i < segments.length - 1; i += 1) {
      if (!(current as Record<string, unknown>)[segments[i]]) return;
      current = (current as Record<string, unknown>)[segments[i]];
    }

    if (typeof current === 'object' && current !== null) {
      delete (current as Record<string, unknown>)[segments[segments.length - 1]];
    }
  });
};

const removeVersion = (ret: DocumentObject): void => {
  if (typeof ret.__v === 'undefined') return;
  delete ret.__v;
};

export const toJSON = (schema: Schema): void => {
  const schemaWithOptions = schema as SchemaWithOptions;
  const existingTransform = schemaWithOptions.options?.toJSON?.transform;

  // Extend toJSON options
  schemaWithOptions.options = schemaWithOptions.options || {};
  schemaWithOptions.options.toJSON = Object.assign(schemaWithOptions.options.toJSON || {}, {
    transform: (doc: Document, ret: DocumentObject) => {
      const toJSONOptions = schemaWithOptions.options?.toJSON || {};

      // Only apply transformations if they are enabled (default to true for backward compatibility)
      if (toJSONOptions.removePrivatePaths !== false) {
        removePrivatePaths(ret, schema);
      }

      if (toJSONOptions.removeVersion !== false) {
        removeVersion(ret);
      }

      if (toJSONOptions.normalizeId !== false) {
        normalizeId(ret);
      }

      return existingTransform ? existingTransform(doc, ret) : ret;
    }
  });
};
