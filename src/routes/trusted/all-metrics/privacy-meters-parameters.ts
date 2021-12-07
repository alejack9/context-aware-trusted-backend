export const perturbatorEnabled = false;
export const perturbatorDecimals = [1, 2, 3, 4, 5];
export const dummyUpdatesEnabled = false;
export const dummyUpdatesCount = 10;
export const dummyUpdatesRadiusMin = [500, 1_000, 1_500, 2_000, 3_000];
export const dummyUpdatesRadiusRange = [250, 500, 750, 1_000, 2_000];
export const hyperparamsLength =
  perturbatorDecimals.length *
  dummyUpdatesRadiusMin.length *
  dummyUpdatesRadiusRange.length;
