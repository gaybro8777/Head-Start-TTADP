import React, {
  useState,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import DropdownMenu from '../DropdownMenu';
import FilterItem from './FilterItem';
import { FILTER_CONFIG } from './constants';
import { formatDateRange } from '../DateRangeSelect';
import usePrevious from '../../hooks/usePrevious';

// save this to cut down on repeated boilerplate in PropTypes
const filterProp = PropTypes.shape({
  topic: PropTypes.string,
  condition: PropTypes.string,
  query: PropTypes.oneOfType([
    PropTypes.string, PropTypes.arrayOf(PropTypes.string), PropTypes.number,
  ]),
  id: PropTypes.string,
});

// a list of all the filter topics available
const availableFilters = FILTER_CONFIG.map((f) => f.id);

/**
 * Renders the entire filter menu and contains the logic for toggling it's visibility
 * @param {Object} props
 * @returns JSX Object
 */
export default function FilterMenu({
  filters, onApplyFilters, allowedFilters, dateRangeOptions,
}) {
  const [items, setItems] = useState([...filters.map((filter) => ({ ...filter }))]);
  const [errors, setErrors] = useState(filters.map(() => ''));

  const itemLength = usePrevious(items.length);

  const validate = ({ topic, query, condition }) => {
    if (!topic) {
      return 'Please enter a filter';
    }

    if (!condition) {
      return 'Please enter a condition';
    }

    if (!query || !query.toString().length) {
      return 'Please enter a value';
    }

    if (query.toString().includes('Invalid date') || (topic === 'startDate' && query.toString() === '-')) {
      return 'Please enter a value';
    }

    return '';
  };

  // filters currently selected. these will be excluded from filter selection
  const selectedFilters = items.map((filter) => filter.topic);

  // filters that aren't allowed per our allowedFilters prop
  const prohibitedFilters = availableFilters.filter((f) => !allowedFilters.includes(f));

  // If filters were changed outside of this component, we need to update the items
  // (for example, the "remove filter" button on the filter pills)
  useEffect(() => {
    setItems(filters);
  }, [filters]);

  // if an item was deleted, we need to update the errors
  useEffect(() => {
    if (items.length < errors.length) {
      setErrors(items.map(() => ''));
    }
  }, [errors.length, items]);

  // focus on the first topic if we add more
  useEffect(() => {
    if (items.length > itemLength) {
      const [topic] = Array.from(document.querySelectorAll('[name="topic"]')).slice(-1);

      if (topic && !topic.value) {
        topic.focus();
      }
    }
  }, [itemLength, items.length]);

  const onApply = () => {
    // first, we validate
    const hasErrors = items.reduce((acc, curr, index) => {
      if (acc) {
        return true;
      }

      const setError = (message) => {
        const newErrors = [...errors];
        newErrors.splice(index, 1, message);
        setErrors(newErrors);
      };

      const message = validate(curr);

      if (message) {
        setError(message);
        return true;
      }

      return false;
    }, false);

    // if validation was not successful
    if (hasErrors) {
      return false;
    }

    // otherwise, we apply
    onApplyFilters(items);
    return true;
  };

  const onRemoveFilter = (id) => {
    const newItems = items.map((item) => ({ ...item }));
    const index = newItems.findIndex((item) => item.id === id);

    if (index !== -1) {
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  // reset state if we hit cancel
  const onCancel = () => {
    const copyOfFilters = filters.map((filter) => ({ ...filter }));
    setItems(copyOfFilters);
  };

  const onUpdateFilter = (id, name, value) => {
    //
    // just an array spread creates a new
    // array of references... to the same objects as before
    // therefore, this function was mutating state in unexpected ways
    //
    // hence this real humdinger of a line of javascript
    const newItems = items.map((item) => ({ ...item }));
    const toUpdate = newItems.find((item) => item.id === id);

    // and here is the key to all the problems
    // the (preventing of) infinite updating itself
    if (toUpdate[name] === value) {
      return;
    }
    toUpdate[name] = value;

    if (name === 'topic') {
      toUpdate.condition = '';
      toUpdate.query = '';
    }

    setItems(newItems);
  };

  const onAddFilter = () => {
    const newItems = [...items.map((item) => ({ ...item }))];
    const newItem = {
      id: uuidv4(),
      display: '',
      conditions: [],
    };
    newItems.push(newItem);
    setItems(newItems);
  };

  const clearAllFilters = () => {
    // this looks a little strange, right?
    // well, we don't want to clear out things like the region, just the filters that can be set
    // in the UI
    const newItems = items.filter((item) => prohibitedFilters.includes(item.topic));
    setItems(newItems);
  };

  const canBlur = () => false;

  const ClearAllButton = () => <button type="button" onClick={clearAllFilters} className="usa-button usa-button--unstyled">Clear all filters</button>;

  return (
    <DropdownMenu
      buttonText="Filters"
      buttonAriaLabel="open filters for this page"
      onApply={onApply}
      applyButtonAria="apply filters to this page"
      showCancel
      onCancel={onCancel}
      cancelAriaLabel="discard changes and close filter menu"
      className="ttahub-filter-menu margin-right-1"
      menuName="filter menu"
      canBlur={canBlur}
      AlternateActionButton={ClearAllButton}
    >
      <div className="ttahub-filter-menu-filters padding-x-3 padding-y-2">
        <p className="margin-bottom-2"><strong>Show results for the following filters.</strong></p>
        <div>
          <div className="margin-bottom-1">
            {items.map((filter, index) => (
              <FilterItem
                onRemoveFilter={onRemoveFilter}
                onUpdateFilter={onUpdateFilter}
                key={filter.id}
                filter={filter}
                prohibitedFilters={prohibitedFilters}
                selectedFilters={selectedFilters}
                dateRangeOptions={dateRangeOptions}
                errors={errors}
                setErrors={setErrors}
                validate={validate}
                index={index}
              />
            ))}
          </div>
          <button type="button" className="usa-button usa-button--outline margin-top-1" onClick={onAddFilter}>Add new filter</button>
        </div>
      </div>

    </DropdownMenu>
  );
}

FilterMenu.propTypes = {
  filters: PropTypes.arrayOf(filterProp).isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  allowedFilters: PropTypes.arrayOf(PropTypes.string),
  dateRangeOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number,
    range: PropTypes.string,
  })),
};

FilterMenu.defaultProps = {
  allowedFilters: availableFilters,
  dateRangeOptions: [
    {
      label: 'Year to date',
      value: 1,
      range: formatDateRange({ yearToDate: true, forDateTime: true }),
    },
    {
      label: 'Custom date range',
      value: 2,
      range: '',
    },
  ],
};
