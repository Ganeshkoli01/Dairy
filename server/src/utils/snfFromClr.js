/**
 * Calculate SNF from FAT and CLR (Lactometer reading / डिग्री)
 * Formula: SNF = (CLR / 4) + (0.2 * fat) + 0.36
 * @param {number} fat - Fat percentage (e.g., 3.5)
 * @param {number} clr - CLR reading (e.g., 28.0)
 * @returns {number} Calculated SNF rounded to 2 decimal places
 */
export const calculateSnfFromClr = (fat, clr) => {
  if (fat === undefined || fat === null || clr === undefined || clr === null) {
    return 0;
  }
  const fatVal = Number(fat);
  const clrVal = Number(clr);
  if (isNaN(fatVal) || isNaN(clrVal)) return 0;

  const rawSnf = clrVal / 4 + 0.2 * fatVal + 0.36;
  return Math.round(rawSnf * 100) / 100;
};
