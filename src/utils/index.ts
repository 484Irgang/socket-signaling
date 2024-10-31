export const omit = <T extends object, K extends keyof T>(
  object: T,
  keys: K[]
) => {
  const shallowCopy = { ...object };
  keys.forEach((key) => {
    delete shallowCopy[key];
  });
  return shallowCopy;
};
