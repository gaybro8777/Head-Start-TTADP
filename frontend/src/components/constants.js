export const CONTAINS = 'Contains';
export const NOT_CONTAINS = 'Does not contain';
export const BEFORE = 'Is before';
export const AFTER = 'Is after';
export const WITHIN = 'Is within';
export const IS = 'is';
export const IS_NOT = 'is not';
export const ONE_OF = 'One of';

export const SELECT_CONDITIONS = [CONTAINS, NOT_CONTAINS];
export const DATE_CONDITIONS = [BEFORE, AFTER, WITHIN];
export const FILTER_CONDITIONS = [IS, IS_NOT];

export const QUERY_CONDITIONS = {
  [CONTAINS]: 'in[]',
  [NOT_CONTAINS]: 'nin[]',
  [BEFORE]: 'bef',
  [AFTER]: 'aft',
  [WITHIN]: 'win',
  [IS]: 'in[]',
  [IS_NOT]: 'nin[]',
};

export const DATE_FORMAT = 'MM/DD/YYYY';
export const DATETIME_DATE_FORMAT = 'YYYY/MM/DD';

export const DATE_OPTIONS = [
  {
    label: 'Last 30 Days',
    value: 1,
  },
  {
    label: 'Custom Date Range',
    value: 2,
  },
];

export const LAST_THIRTY_DAYS = DATE_OPTIONS[0].value;
export const CUSTOM_DATE_RANGE = DATE_OPTIONS[1].value;
