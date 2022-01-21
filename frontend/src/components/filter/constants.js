import React from 'react';
import moment from 'moment';
import { formatDateRange } from '../../utils';
import {
  DATE_CONDITIONS,
  SELECT_CONDITIONS,
  FILTER_CONDITIONS,
} from '../../Constants';
import FilterDateRange from './FilterDateRange';
import FilterInput from './FilterInput';
import FilterReasonSelect from './FilterReasonSelect';
import FilterRegionalSelect from './FilterRegionSelect';
import FilterTopicSelect from './FilterTopicSelect';
import FilterPopulationSelect from './FilterPopulationSelect';
import FilterProgramType from './FilterProgramType';
import FilterSpecialistSelect from './FilterSpecialistSelect';
import FilterStateSelect from './FilterStateSelect';

const EMPTY_MULTI_SELECT = {
  Is: [],
  'Is not': [],
};

const EMPTY_SINGLE_SELECT = {
  Is: '',
  'Is not': '',
};

const EMPTY_TEXT_INPUT = {
  Contains: '',
  'Does not contain': '',
};

const handleArrayQuery = (q) => {
  if (q.length) {
    return [q].flat().join(', ');
  }
  return '';
};

const handleStringQuery = (q) => q;

export const FILTER_CONFIG = [
  {
    id: 'startDate',
    display: 'Date range',
    conditions: DATE_CONDITIONS,
    defaultValues: {
      'Is within': '',
      'Is after': '',
      'Is before': '',
      In: '',
    },
    displayQuery: (query) => {
      if (query.includes('-')) {
        return formatDateRange({
          string: query,
          withSpaces: false,
        });
      }
      return moment(query, 'YYYY/MM/DD').format('MM/DD/YYYY');
    },
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterDateRange
        condition={condition}
        query={query}
        updateSingleDate={onApplyQuery}
        onApplyDateRange={onApplyQuery}
      />
    ),
  },
  {
    id: 'grantNumber',
    display: 'Grant number',
    conditions: SELECT_CONDITIONS,
    defaultValues: EMPTY_TEXT_INPUT,
    displayQuery: handleStringQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterInput
        query={query}
        inputId={`grantNumber-${condition}-${id}`}
        onApply={onApplyQuery}
        label="Enter a grant number"
      />
    ),
  },
  {
    id: 'programSpecialist',
    display: 'Program specialist',
    conditions: SELECT_CONDITIONS,
    defaultValues: EMPTY_TEXT_INPUT,
    displayQuery: handleStringQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterInput
        query={query}
        inputId={`reason-${condition}-${id}`}
        onApply={onApplyQuery}
        label="Enter a program specialist name"
      />
    ),
  },
  {
    id: 'programType',
    display: 'Program types',
    conditions: FILTER_CONDITIONS,
    defaultValues: EMPTY_MULTI_SELECT,
    displayQuery: handleArrayQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterProgramType
        inputId={`programType-${condition}-${id}`}
        onApply={onApplyQuery}
        query={query}
      />
    ),
  },
  {
    id: 'reason',
    display: 'Reasons',
    conditions: FILTER_CONDITIONS,
    defaultValues: EMPTY_MULTI_SELECT,
    displayQuery: handleArrayQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterReasonSelect
        inputId={`reason-${condition}-${id}`}
        onApply={onApplyQuery}
        query={query}
      />
    ),
  },
  {
    id: 'recipient',
    display: 'Recipient name',
    conditions: SELECT_CONDITIONS,
    defaultValues: EMPTY_TEXT_INPUT,
    displayQuery: handleStringQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterInput
        query={query}
        inputId={`recipient-${condition}-${id}`}
        onApply={onApplyQuery}
        label="Enter a recipient name"
      />
    ),
  },
  {
    id: 'reportId',
    display: 'Report ID',
    conditions: SELECT_CONDITIONS,
    defaultValues: EMPTY_TEXT_INPUT,
    displayQuery: handleStringQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterInput
        query={query}
        inputId={`reportId-${condition}-${id}`}
        onApply={onApplyQuery}
        label="Enter a report id"
      />
    ),
  },
  {
    id: 'region',
    display: 'Region',
    conditions: FILTER_CONDITIONS,
    defaultValues: EMPTY_SINGLE_SELECT,
    displayQuery: handleStringQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterRegionalSelect
        appliedRegion={query}
        onApply={onApplyQuery}
      />
    ),
  },
  {
    id: 'role',
    display: 'Specialist roles',
    conditions: FILTER_CONDITIONS,
    defaultValues: EMPTY_MULTI_SELECT,
    displayQuery: handleArrayQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterSpecialistSelect
        inputId={`role-${condition}-${id}`}
        onApply={onApplyQuery}
        query={query}
      />
    ),
  },
  {
    id: 'stateCode',
    display: 'State',
    conditions: ['Contains'],
    defaultValues: EMPTY_MULTI_SELECT,
    displayQuery: handleArrayQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterStateSelect
        inputId={`state-${condition}-${id}`}
        onApply={onApplyQuery}
        query={query}
      />
    ),
  },
  {
    id: 'targetPopulations',
    display: 'Target populations',
    conditions: FILTER_CONDITIONS,
    defaultValues: EMPTY_MULTI_SELECT,
    displayQuery: handleArrayQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterPopulationSelect
        inputId={`population-${condition}-${id}`}
        onApply={onApplyQuery}
        query={query}
      />
    ),
  },
  {
    id: 'topic',
    display: 'Topics',
    conditions: FILTER_CONDITIONS,
    defaultValues: EMPTY_MULTI_SELECT,
    displayQuery: handleArrayQuery,
    renderInput: (id, condition, query, onApplyQuery) => (
      <FilterTopicSelect
        inputId={`topic-${condition}-${id}`}
        onApply={onApplyQuery}
        query={query}
      />
    ),
  },
];

// a list of all the filter topics available
export const AVAILABLE_FILTERS = FILTER_CONFIG.map((f) => f.id);