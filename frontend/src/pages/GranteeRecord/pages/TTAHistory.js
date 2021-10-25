import React from 'react';
import PropTypes from 'prop-types';
import Overview from '../../../widgets/DashboardOverview';
import FilterMenu from '../../../components/FilterMenu';

function expandFilters(filters) {
  const arr = [];

  filters.forEach((filter) => {
    const { topic, query, condition } = filter;
    if (Array.isArray(query)) {
      query.forEach((q) => {
        arr.push({
          topic,
          condition,
          query: q,
        });
      });
    } else {
      arr.push(filter);
    }
  });

  return arr;
}

export default function TTAHistory({ filters, onApplyFilters }) {
  const onApply = (newFilters) => {
    onApplyFilters([
      ...newFilters,
    ]);
  };

  const filtersToApply = [
    ...expandFilters(filters),
  ];

  return (
    <div className="margin-right-3">
      <FilterMenu filters={filters} onApplyFilters={onApply} />
      <Overview
        fields={[
          'Activity reports',
          'Hours of TTA',
          'Participants',
          'In-person activities',
        ]}
        showTooltips
        filters={filtersToApply}
      />
    </div>
  );
}

const filtersProp = PropTypes.arrayOf(PropTypes.shape({
  id: PropTypes.string,
  topic: PropTypes.string,
  condition: PropTypes.string,
  query: PropTypes.oneOfType(
    [PropTypes.string, PropTypes.number, PropTypes.arrayOf(PropTypes.string)],
  ),
}));

TTAHistory.propTypes = {
  filters: filtersProp,
  onApplyFilters: PropTypes.func.isRequired,
};

TTAHistory.defaultProps = {
  filters: [],
};
