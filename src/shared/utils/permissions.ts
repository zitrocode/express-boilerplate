import PERMISSION_MAP from '@/constants/permission-map.constant';

const expandPermissions = (permissions: string[]): string[] => {
  const expanded = new Set(permissions);

  permissions.forEach((perm) => {
    const implied = PERMISSION_MAP[perm];
    if (implied) {
      implied.forEach((p) => expanded.add(p));
    }
  });

  return Array.from(expanded);
};

export default expandPermissions;
