export interface QueryOptions {
  sort?: Record<string, 1 | -1>;
  page?: number;
  limit?: number;
}
