// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pick = <T extends Record<string, any>>(object: T, keys: string[]): Partial<T> => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key as keyof T] = object[key];
    }
    return obj;
  }, {} as Partial<T>);
};

export default pick;
