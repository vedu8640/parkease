export const isCollegeIdOrEmail = (value) =>
  /.+@.+\..+/.test(value) || /^[A-Za-z0-9/-]{4,}$/.test(value);
export const passwordStrength = (value) =>
  value.length > 9 ? 3 : value.length > 5 ? 2 : value ? 1 : 0;
export const passwordsMatch = (password, confirmation) =>
  !confirmation || password === confirmation;
