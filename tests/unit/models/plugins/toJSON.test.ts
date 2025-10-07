import mongoose, { Document, Schema, SchemaDefinition, Connection } from 'mongoose';
import { toJSON } from '@/models/plugins/toJSON.plugin';

interface TestDoc extends Document {
  public?: string;
  private?: string;
  nested?: {
    private?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

describe('toJSON plugin', () => {
  let connection: Connection;

  beforeEach(() => {
    connection = mongoose.createConnection();
  });

  test('should replace _id with id', () => {
    const schema = new Schema({});
    schema.plugin(toJSON);
    const Model = connection.model<TestDoc>('Model', schema);
    const doc = new Model();
    const json = doc.toJSON();
    expect(json).not.toHaveProperty('_id');
    expect(json).toHaveProperty('id', String(doc._id));
  });

  test('should remove __v', () => {
    const schema = new Schema({});
    schema.plugin(toJSON);
    const Model = connection.model<TestDoc>('Model', schema);
    const doc = new Model();
    const json = doc.toJSON();
    expect(json).not.toHaveProperty('__v');
  });

  test('should remove createdAt and updatedAt', () => {
    const schema = new Schema({}, { timestamps: true });
    schema.plugin(toJSON);
    const Model = connection.model<TestDoc>('Model', schema);
    const doc = new Model();
    const json = doc.toJSON();
    expect(json).not.toHaveProperty('createdAt');
    expect(json).not.toHaveProperty('updatedAt');
  });

  test('should remove any path set as private', () => {
    const schemaDef: SchemaDefinition = {
      public: { type: String },
      private: { type: String, private: true }
    };
    const schema = new Schema(schemaDef);
    schema.plugin(toJSON);
    const Model = connection.model<TestDoc>('Model', schema);
    const doc = new Model({ public: 'some public value', private: 'some private value' });
    const json = doc.toJSON();
    expect(json).not.toHaveProperty('private');
    expect(json).toHaveProperty('public');
  });

  test('should remove any nested paths set as private', () => {
    const schemaDef: SchemaDefinition = {
      public: { type: String },
      nested: {
        private: { type: String, private: true }
      }
    };
    const schema = new Schema(schemaDef);
    schema.plugin(toJSON);
    const Model = connection.model<TestDoc>('Model', schema);
    const doc = new Model({
      public: 'some public value',
      nested: {
        private: 'some nested private value'
      }
    });
    const json = doc.toJSON();
    expect(json.nested).not.toHaveProperty('private');
    expect(json).toHaveProperty('public');
  });

  test('should also call the schema toJSON transform function', () => {
    const schema = new Schema(
      {
        public: { type: String },
        private: { type: String }
      },
      {
        toJSON: {
          transform: (_doc, ret) => {
            // eslint-disable-next-line no-param-reassign
            delete ret.private;
          }
        }
      }
    );
    schema.plugin(toJSON);
    const Model = connection.model<TestDoc>('Model', schema);
    const doc = new Model({ public: 'some public value', private: 'some private value' });
    const json = doc.toJSON();
    expect(json).not.toHaveProperty('private');
    expect(json).toHaveProperty('public');
  });
});
