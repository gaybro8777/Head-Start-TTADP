import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Grid } from '@trussworks/react-uswds';
import { v4 as uuidv4 } from 'uuid';
import { formatDateRange } from '../../../components/DateRangeSelect';
import ActivityReportsTable from '../../../components/ActivityReportsTable';
import FrequencyGraph from '../../../widgets/FrequencyGraph';
import Overview from '../../../widgets/DashboardOverview';
import FilterMenu from '../../../components/filter/FilterMenu';
import FilterPills from '../../../components/filter/FilterPills';
import TargetPopulationsTable from '../../../widgets/TargetPopulationsTable';
import { expandFilters } from '../../../utils';

import './TTAHistory.css';

const defaultDate = formatDateRange({
  yearToDate: true,
  forDateTime: true,
});

export default function TTAHistory({
  granteeName, granteeId, regionId,
}) {
  const [filters, setFilters] = useState([
    {
      id: uuidv4(),
      topic: 'startDate',
      condition: 'Is within',
      query: defaultDate,
    },
  ]);

  const filtersToApply = [
    ...expandFilters(filters),
    {
      topic: 'region',
      condition: 'Contains',
      query: regionId,
    },
    {
      topic: 'granteeId',
      condition: 'Contains',
      query: granteeId,
    },
  ];

  const onRemoveFilter = (id) => {
    const newFilters = [...filters];
    const index = newFilters.findIndex((item) => item.id === id);
    if (index !== -1) {
      newFilters.splice(index, 1);
      setFilters(newFilters);
    }
  };

  const onApply = (newFilters) => {
    setFilters([
      ...newFilters,
    ]);
  };

  return (
    <>
      <Helmet>
        <title>
          Grantee TTA History -
          {' '}
          {granteeName}
        </title>
      </Helmet>
      <div className="margin-x-2 maxw-widescreen">
        <div className="display-flex flex-wrap margin-bottom-2">
          <FilterMenu
            filters={filters}
            onApplyFilters={onApply}
            onRemoveFilter={onRemoveFilter}
            allowedFilters={['startDate', 'role']}
          />
          <FilterPills filters={filters} onRemoveFilter={onRemoveFilter} />
        </div>
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
        <Grid row gap={2}>
          <Grid desktop={{ col: 8 }} tabletLg={{ col: 12 }}>
            <FrequencyGraph filters={filtersToApply} />
          </Grid>
          <Grid desktop={{ col: 4 }} tabletLg={{ col: 12 }}>
            <TargetPopulationsTable
              filters={filtersToApply}
            />
          </Grid>
        </Grid>
        <ActivityReportsTable
          filters={filtersToApply}
          showFilter={false}
          tableCaption="Activity Reports"
        />
      </div>
    </>
  );
}

TTAHistory.propTypes = {
  granteeName: PropTypes.string,
  granteeId: PropTypes.string.isRequired,
  regionId: PropTypes.string.isRequired,
};

TTAHistory.defaultProps = {
  granteeName: '',
};
