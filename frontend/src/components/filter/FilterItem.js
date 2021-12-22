import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import FilterDateRange from './FilterDateRange';
import { formatDateRange } from '../DateRangeSelect';
import FilterSpecialistSelect from './FilterSpecialistSelect';
import {
  DATE_CONDITIONS,
  SELECT_CONDITIONS,
} from '../constants';
import './FilterItem.css';

const YEAR_TO_DATE = formatDateRange({
  yearToDate: true,
  forDateTime: true,
});

const filterProp = PropTypes.shape({
  topic: PropTypes.string,
  condition: PropTypes.string,
  query: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  id: PropTypes.string,
});

const DEFAULT_VALUES = {
  startDate: {
    Is: '', 'Is within': YEAR_TO_DATE, 'Is after': '', 'Is before': '',
  },
  role: { Contains: [], 'Does not contain': [] },
};

/**
 * The individual filter controls with the set of dropdowns
 *
 * @param {Object} props
 * @returns a JSX object
 */
export default function FilterItem({
  filter,
  onRemoveFilter,
  onUpdateFilter,
  errors,
  setErrors,
  index,
  validate,
}) {
  const {
    id,
    topic,
    condition,
    query,
  } = filter;

  const li = useRef();

  const setError = (message) => {
    const newErrors = [...errors];
    newErrors.splice(index, 1, message);
    setErrors(newErrors);
  };

  const onBlur = (e) => {
    // no validation if you are clicking on something within the filter item
    if (li.current.contains(e.relatedTarget)) {
      return;
    }

    // no validation if you are clicking on the cancel button
    if (e.relatedTarget && e.relatedTarget.getAttribute('aria-label') === 'discard changes and close filter menu') {
      return;
    }

    validate(filter, setError);
  };

  /**
   * changing the condition should clear the query
   * Having to do this, I set the default values to be empty where possible
   * since that creates the least complicated and confusing logic in the
   * function below
   */
  const onUpdate = (name, value) => {
    if (name === 'condition') {
      // Set default value.
      const defaultQuery = DEFAULT_VALUES[topic][value];
      onUpdateFilter(id, 'query', defaultQuery);
    }

    onUpdateFilter(id, name, value);
  };

  const DummySelect = () => (
    <select className="usa-select ttahub-dummy-select" disabled aria-label="select a topic and condition first and then select a query" />
  );

  const onApplyQuery = (q) => {
    onUpdate('query', q);
  };

  const possibleFilters = [
    {
      id: 'role',
      display: 'Specialist',
      conditions: SELECT_CONDITIONS,
      renderInput: () => (
        <FilterSpecialistSelect
          labelId={`role-${condition}-${id}`}
          onApplyRoles={onApplyQuery}
        />
      ),
    },
    {
      id: 'startDate',
      display: 'Date range',
      conditions: DATE_CONDITIONS,
      renderInput: () => (
        <FilterDateRange
          condition={condition}
          query={query}
          onApplyDateRange={onApplyQuery}
          id={id}
        />
      ),
    },
  ];

  const selectedTopic = possibleFilters.find((f) => f.id === topic);
  const conditions = selectedTopic ? selectedTopic.conditions : [];

  const onRemove = () => {
    onRemoveFilter(id);
  };

  let readableFilterName = '';
  if (selectedTopic) {
    readableFilterName = selectedTopic.display;
  }

  const buttonAriaLabel = readableFilterName
    ? `remove ${readableFilterName} ${condition} ${query} filter. click apply filters to make your changes`
    : 'remove this filter. click apply filters to make your changes';

  const error = errors[index];

  const fieldsetBaseClass = 'ttahub-filter-menu-item position-relative gap-1 desktop:display-flex border-0 padding-0';
  let fieldsetErrorClass = '';

  switch (error) {
    case 'Please enter a value':
      fieldsetErrorClass = 'ttahub-filter-menu-item--error ttahub-filter-menu-item--error--value';
      break;
    case 'Please enter a condition':
      fieldsetErrorClass = 'ttahub-filter-menu-item--error ttahub-filter-menu-item--error--condition';
      break;
    case 'Please enter a filter':
      fieldsetErrorClass = 'ttahub-filter-menu-item--error ttahub-filter-menu-item--error--filter';
      break;
    default:
      break;
  }

  const fieldsetClassNames = `${fieldsetBaseClass} ${fieldsetErrorClass}`;

  return (
    <fieldset className={fieldsetClassNames} onBlur={onBlur} ref={li}>
      {
        error
        && (
        <span className="ttahub-filter-menu-error" role="status">
          <strong>{error}</strong>
        </span>
        )
      }
      { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="sr-only" htmlFor={`topic-${id}`}>
        Select a filter
      </label>
      <select
        id={`topic-${id}`}
        name="topic"
        aria-label="topic"
        value={topic}
        onChange={(e) => onUpdate(e.target.name, e.target.value)}
        className="usa-select"
      >
        <option value="" hidden disabled selected>- Select -</option>
        {possibleFilters.map(({ id: filterId, display }) => (
          <option key={filterId} value={filterId}>{display}</option>
        ))}
      </select>
      { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="sr-only" htmlFor={`condition-${id}`}>
        Select a condition
      </label>
      <select
        id={`condition-${id}`}
        name="condition"
        aria-label="condition"
        value={condition}
        disabled={!topic}
        onChange={(e) => onUpdate(e.target.name, e.target.value)}
        className="usa-select"
      >
        <option value="" hidden disabled selected>- Select -</option>
        {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      { selectedTopic && condition
        ? selectedTopic.renderInput()
        : <DummySelect /> }
      <button
        type="button"
        aria-label={buttonAriaLabel}
        className="ttahub-filter-menu-item-close-buttom usa-button usa-button--unstyled font-sans-xs desktop:margin-x-1 margin-top-1 desktop:margin-bottom-0 margin-bottom-4"
        onClick={onRemove}
      >
        <span className="desktop:display-none margin-right-1">Remove filter</span>
        <FontAwesomeIcon color="gray" icon={faTimesCircle} />
      </button>
    </fieldset>
  );
}

FilterItem.propTypes = {
  filter: filterProp.isRequired,
  onRemoveFilter: PropTypes.func.isRequired,
  onUpdateFilter: PropTypes.func.isRequired,
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
  setErrors: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  validate: PropTypes.func.isRequired,
};
