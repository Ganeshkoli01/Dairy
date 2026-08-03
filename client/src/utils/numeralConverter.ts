/**
 * Utility for converting between English (0-9) and Marathi / Devanagari (०-९) numerals.
 */

const englishToMarathiMap: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

const marathiToEnglishMap: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

export type NumeralLang = 'en' | 'mr';

/**
 * Convert any string or number to Marathi / Devanagari numerals
 */
export const toMarathiNumerals = (input: string | number): string => {
  if (input === null || input === undefined || input === '') return '';
  const str = String(input);
  return str.replace(/[0-9]/g, (digit) => englishToMarathiMap[digit] || digit);
};

/**
 * Convert any Marathi / Devanagari string to standard English numerals
 */
export const toEnglishNumerals = (input: string | number): string => {
  if (input === null || input === undefined || input === '') return '';
  let str = String(input);
  for (const [m, e] of Object.entries(marathiToEnglishMap)) {
    str = str.replace(new RegExp(m, 'g'), e);
  }
  return str;
};

/**
 * Format a number or string based on selected NumeralLang ('en' | 'mr')
 */
export const formatNumeral = (val: string | number, lang: NumeralLang): string => {
  if (val === null || val === undefined || val === '') return '';
  const str = typeof val === 'number' ? String(val) : val;
  if (lang === 'mr') {
    return toMarathiNumerals(str);
  }
  return toEnglishNumerals(str);
};
