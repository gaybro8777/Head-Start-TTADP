import React from 'react';
import PropTypes from 'prop-types';
import DateRangeSelect from '../DateRangeSelect';
import DatePicker from '../FilterDatePicker';
import './FilterDateRange.css';

export default function FilterDateRange({
  id,
  condition,
  query,
  onApplyDateRange,
  options,
}) {
  const onChange = (dateRange) => {
    onApplyDateRange(dateRange);
  };

  if (condition === 'Is within') {
    return (
      <DateRangeSelect
        options={options}
        updateDateRange={onApplyDateRange}
        styleAsSelect
        onChange={onChange}
        dateRange={query}
      />
    );
  }

  let singleDateQuery = '';

  if (!Array.isArray(query) && typeof query === 'string' && query.split('-').length === 1) {
    singleDateQuery = query;
  }

  const onChangeSingleDate = (name, value) => {
    if (value) {
      onApplyDateRange(value);
    } else {
      onApplyDateRange('');
    }
  };

  return (
    <span className="border display-flex margin-top-1 ttahub-filter-date-range-single-date">
      <DatePicker query={singleDateQuery} onUpdateFilter={onChangeSingleDate} id={`filter-date-picker-${id}`} />
    </span>
  );
}

FilterDateRange.propTypes = {
  condition: PropTypes.string.isRequired,
  query: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  onApplyDateRange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number,
    range: PropTypes.string,
  })).isRequired,
  id: PropTypes.string.isRequired,
};
