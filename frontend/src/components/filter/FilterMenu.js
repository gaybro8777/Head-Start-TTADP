import React, {
  useState,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import DropdownMenu from '../DropdownMenu';
import FilterItem from './FilterItem';

// save this to cut down on repeated boilerplate in PropTypes
const filterProp = PropTypes.shape({
  topic: PropTypes.string,
  condition: PropTypes.string,
  query: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  id: PropTypes.string,
});

/**
 * Renders the entire filter menu and contains the logic for toggling it's visibility
 * @param {Object} props
 * @returns JSX Object
 */
export default function FilterMenu({ filters, onApplyFilters }) {
  const [items, setItems] = useState([...filters.map((filter) => ({ ...filter }))]);
  const [errors, setErrors] = useState(filters.map(() => ''));

  useEffect(() => {
    // If filters were changed outside of this component, we need to update the items
    // (for example, the "remove filter" button on the filter pills)
    setItems(filters);
  }, [filters]);

  useEffect(() => {
    // if an item was deleted, we need to update the errors
    if (items.length < errors.length) {
      setErrors(items.map(() => ''));
    }
  }, [errors.length, items]);

  const onApply = () => {
    const hasErrors = errors.reduce((acc, curr) => {
      if (curr) {
        return true;
      }

      return acc;
    }, false);

    if (hasErrors) {
      return false;
    }

    onApplyFilters(items.filter((item) => item.topic && item.condition && item.query));
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
    // this is bonkers... we need to do more than map the array
    // what escaped me originally was that just an array spread creates a new
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

  const canBlur = () => false;

  return (
    <DropdownMenu
      buttonText="Filters"
      buttonAriaLabel="open filters for this page"
      onApply={onApply}
      applyButtonAria="apply filters to grantee record data"
      showCancel
      onCancel={onCancel}
      cancelAriaLabel="discard changes and close filter menu"
      className="ttahub-filter-menu margin-right-1"
      menuName="filter menu"
      canBlur={canBlur}
    >
      <div className="ttahub-filter-menu-filters padding-x-3 padding-y-2">
        <p className="margin-bottom-2"><strong>Show results matching the following conditions.</strong></p>
        <div>
          <form onSubmit={onApply}>
            <ul className="usa-list usa-list--unstyled margin-bottom-1">
              {items.map((filter, index) => (
                <FilterItem
                  onRemoveFilter={onRemoveFilter}
                  onUpdateFilter={onUpdateFilter}
                  key={filter.id}
                  filter={filter}
                  index={index}
                  errors={errors}
                  setErrors={setErrors}
                />
              ))}
            </ul>
            <button type="button" className="usa-button usa-button--unstyled margin-top-1" onClick={onAddFilter}>Add new filter</button>
          </form>
        </div>
      </div>
    </DropdownMenu>
  );
}

FilterMenu.propTypes = {
  filters: PropTypes.arrayOf(filterProp).isRequired,
  onApplyFilters: PropTypes.func.isRequired,
};
