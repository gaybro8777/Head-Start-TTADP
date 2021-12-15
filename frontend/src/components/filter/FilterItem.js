import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import './FilterItem.css';

import { FILTER_CONFIG } from './constants';
import { DropdownMenuContext } from '../DropdownMenu';

const filterProp = PropTypes.shape({
  topic: PropTypes.string,
  condition: PropTypes.string,
  query: PropTypes.oneOfType([
    PropTypes.string, PropTypes.arrayOf(PropTypes.string), PropTypes.number,
  ]),
  id: PropTypes.string,
});

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
  prohibitedFilters,
  selectedFilters,
  dateRangeOptions,
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

  const fieldset = useRef();

  const { onKeyDown } = useContext(DropdownMenuContext);

  if (prohibitedFilters.includes(topic)) {
    return null;
  }

  const setError = (message) => {
    const newErrors = [...errors];
    newErrors.splice(index, 1, message);
    setErrors(newErrors);
  };

  const onBlur = (e) => {
    // no validation if you are clicking on something within the filter item
    if (fieldset.current.contains(e.relatedTarget)) {
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
      /**
       * if the condition is changed, we need to do a lookup in the filter config
       * and set the query to the new default value
       */
      const f = FILTER_CONFIG.find(((config) => config.id === topic));
      const defaultQuery = f.defaultValues[value];

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

  const selectedTopic = FILTER_CONFIG.find((f) => f.id === topic);
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

  const topicOptions = FILTER_CONFIG.filter((config) => (
    topic === config.id || ![...selectedFilters, ...prohibitedFilters].includes(config.id)
  )).map(({ id: filterId, display }) => (
    <option key={filterId} value={filterId}>{display}</option>
  ));
  const error = errors[index];

  const fieldsetBaseClass = 'ttahub-filter-menu-item gap-1 desktop:display-flex border-0 padding-0 position-relative';
  let fieldsetErrorClass = '';

  switch (error) {
    case 'Please enter a value':
      fieldsetErrorClass = 'ttahub-filter-menu-item--error ttahub-filter-menu-item--error--value';
      break;
    case 'Please enter a condition':
      fieldsetErrorClass = 'ttahub-filter-menu-item--error ttahub-filter-menu-item--error--condition';
      break;
    case 'Please enter a parameter':
      fieldsetErrorClass = 'ttahub-filter-menu-item--error ttahub-filter-menu-item--error--parameter';
      break;
    default:
      break;
  }

  const fieldsetClassNames = `${fieldsetBaseClass} ${fieldsetErrorClass}`;
  return (
    <fieldset className={fieldsetClassNames} onBlur={onBlur} ref={fieldset}>
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
        Select a filter topic
      </label>
      <select
        id={`topic-${id}`}
        name="topic"
        aria-label="topic"
        value={topic}
        onChange={(e) => onUpdate(e.target.name, e.target.value)}
        className="usa-select"
        onKeyDown={onKeyDown}
      >
        <option value="" disabled selected>- Select -</option>
        {topicOptions}
      </select>
      { /* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="sr-only" htmlFor={`condition-${id}`}>
        Select a filter condition
      </label>
      <select
        id={`condition-${id}`}
        name="condition"
        aria-label="condition"
        value={condition}
        onChange={(e) => onUpdate(e.target.name, e.target.value)}
        className="usa-select"
        onKeyDown={onKeyDown}
      >
        <option value="" disabled selected>- Select -</option>
        {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      { selectedTopic && condition
        ? selectedTopic.renderInput(
          id, // filter id
          condition, // filter condition
          query, // filter query
          onApplyQuery, // the on apply query
          onKeyDown, // on keydown from the parent context
          dateRangeOptions, // date range options, configurable per filter menu
        )
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
  prohibitedFilters: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedFilters: PropTypes.arrayOf(PropTypes.string).isRequired,
  dateRangeOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number,
    range: PropTypes.string,
  })).isRequired,
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
  setErrors: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  validate: PropTypes.func.isRequired,
};
