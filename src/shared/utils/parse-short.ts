/**
 * Parses a short string into an object suitable for MongoDB sorting.
 * @param short - A string in the format "field:order,field2:order2"
 * @returns An object with fields as keys and 1 or -1 as values, or undefined if input is invalid.
 *
 * Example:
 * parseShort("name:asc,role:desc")
 * returns { name: 1, role: -1 }
 */

const parseShort = (short?: string): Record<string, 1 | -1> | undefined => {
  if (!short) return undefined;

  const shortObject: Record<string, 1 | -1> = {};

  short.split(',').forEach((part) => {
    const [field, order] = part.split(':');
    if (field) {
      const normalized = order?.toLowerCase();
      shortObject[field] = normalized === 'desc' || normalized === '-1' ? -1 : 1;
    }
  });

  return Object.keys(shortObject).length ? shortObject : undefined;
};

export default parseShort;
