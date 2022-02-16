import React from 'react';
import PropTypes from 'prop-types';
import FilterSelect from './FilterSelect';

// when/if we use this status filter for a different model, we can pass these in as a prop instead
// of defining these here

const options = [
  {
    label: 'Needs Status',
    value: 'Needs Status',
  },
  {
    label: 'Draft',
    value: 'Draft',
  },
  {
    label: 'Not Started',
    value: 'Not Started',
  },
  {
    label: 'In Progress',
    value: 'In Progress',
  },
  {
    label: 'Completed',
    value: 'Completed',
  },
  {
    label: 'Ceased/Suspended',
    value: 'Ceased/Suspended',
  },
];

export default function FilterStatus({
  onApply,
  inputId,
  query,
}) {
  const onApplyClick = (selected) => {
    onApply(selected);
  };

  return (
    <FilterSelect
      onApply={onApplyClick}
      inputId={inputId}
      labelText="Select status to filter by"
      options={options}
      selectedValues={query}
    />
  );
}

FilterStatus.propTypes = {
  inputId: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired,
  query: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string,
  ]).isRequired,
};
