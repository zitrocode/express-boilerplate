import mongoose from 'mongoose';
import config from '@/config/config';

const setupTestDB = (): void => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoose.url);
  }, 80000); // Increase timeout for slow DB connections

  beforeEach(async () => {
    await Promise.all(
      Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany())
    );
  });

  afterAll(async () => {
    // await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
};

export default setupTestDB;
