import '@testing-library/jest-dom';
import { queryStringToFilters, filtersToQueryString } from '../utils';

describe('queryStringToFilters', () => {
  it('correct parses the query string', () => {
    const str = 'region.in[]=14&startDate.win=2021/11/13-2021/12/13&gibberish';
    const filters = queryStringToFilters(str);
    expect(filters.length).toBe(2);
    expect(filters.map((filter) => filter.topic)).toStrictEqual(['region', 'startDate']);
    expect(filters.map((filter) => filter.condition)).toStrictEqual(['Contains', 'Is within']);
    expect(filters.map((filter) => filter.query)).toStrictEqual(['14', '2021/11/13-2021/12/13']);
  });
});

describe('filtersToQueryString', () => {
  it('correct parses the filters', () => {
    const filters = [
      {
        id: '9ac8381c-2507-4b4a-a30c-6f1f87a00901',
        topic: 'region',
        condition: 'Contains',
        query: '14',
      },
      {
        id: '07bc65ed-a4ce-410f-b7be-f685bc8921ed',
        topic: 'startDate',
        condition: 'Is within',
        query: '2021/11/13-2021/12/13',
      },
    ];
    const str = filtersToQueryString(filters);
    expect(str).toBe(`region.in[]=14&startDate.win=${encodeURIComponent('2021/11/13-2021/12/13')}`);
  });
});
