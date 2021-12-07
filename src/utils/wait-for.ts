export const waitFor = async (num: number) =>
  new Promise((res) => setTimeout(() => res(null), num));
