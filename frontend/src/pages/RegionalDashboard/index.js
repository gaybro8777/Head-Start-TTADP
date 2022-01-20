import React, { useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { v4 as uuidv4 } from 'uuid';
import { Grid, GridContainer } from '@trussworks/react-uswds';
import FilterPanel from '../../components/filter/FilterPanel';
import { formatDateRange } from '../../components/DateRangeSelect';
import DashboardOverview from '../../widgets/DashboardOverview';
import TopicFrequencyGraph from '../../widgets/TopicFrequencyGraph';
import { getUserRegions } from '../../permissions';
import ReasonList from '../../widgets/ReasonList';
import TotalHrsAndRecipient from '../../widgets/TotalHrsAndRecipientGraph';
import './index.css';
import { expandFilters } from '../../utils';
import useUrlFilters from '../../hooks/useUrlFilters';
import ActivityReportsTable from '../../components/ActivityReportsTable';
import UserContext from '../../UserContext';

const defaultDate = formatDateRange({
  lastThirtyDays: true,
  forDateTime: true,
});

export default function RegionalDashboard() {
  const { user } = useContext(UserContext);

  /**
   * we are going to memoize all this stuff so it doesn't get recomputed each time
   * this is re-rendered. it would (generally) only get recomputed should the user change
   */

  const hasCentralOffice = useMemo(() => (
    user && user.homeRegionId && user.homeRegionId === 14
  ), [user]);
  const regions = useMemo(() => getUserRegions(user), [user]);
  const defaultRegion = useMemo(() => regions[0].toString(), [regions]);

  const defaultFilters = useMemo(() => {
    if (hasCentralOffice) {
      return [
        {
          id: uuidv4(),
          topic: 'startDate',
          condition: 'Is within',
          query: defaultDate,
        },
      ];
    }

    return [
      {
        id: uuidv4(),
        topic: 'region',
        condition: 'Is',
        query: defaultRegion,
      },
      {
        id: uuidv4(),
        topic: 'startDate',
        condition: 'Is within',
        query: defaultDate,
      },
    ];
  }, [defaultRegion, hasCentralOffice]);

  const [filters, setFilters] = useUrlFilters(defaultFilters);

  const regionFilter = filters.find((filter) => filter.topic === 'region');
  const appliedRegion = regionFilter ? regionFilter.query : false;

  const onApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const onRemoveFilter = (id) => {
    const newFilters = [...filters];
    const index = newFilters.findIndex((item) => item.id === id);
    if (index !== -1) {
      newFilters.splice(index, 1);
      setFilters(newFilters);
    }
  };

  const filtersToApply = expandFilters(filters);

  const dateRangeOptions = [
    {
      label: 'Last 30 days',
      value: 1,
      range: formatDateRange({ lastThirtyDays: true, forDateTime: true }),
    },
    {
      label: 'Custom date range',
      value: 2,
      range: '',
    },
  ];

  return (
    <div className="ttahub-dashboard">
      <Helmet titleTemplate="%s - Dashboard - TTA Hub" defaultTitle="TTA Hub - Dashboard" />
      <>
        <Helmet titleTemplate="%s - Dashboard - TTA Hub" defaultTitle="TTA Hub - Dashboard" />
        <h1 className="ttahub--dashboard-title">
          {appliedRegion ? `Region ${appliedRegion}` : 'Regional'}
          {' '}
          TTA Activity Dashboard
        </h1>
        <Grid className="ttahub-dashboard--filters display-flex flex-wrap flex-align-center margin-y-2">
          <FilterPanel
            applyButtonAria="apply filters for regional dashboard"
            filters={filters}
            onApplyFilters={onApplyFilters}
            dateRangeOptions={dateRangeOptions}
            onRemoveFilter={onRemoveFilter}
          />
        </Grid>
        <GridContainer className="margin-0 padding-0">
          <DashboardOverview
            filters={filtersToApply}
          />
          <Grid row gap={2}>
            <Grid desktop={{ col: 5 }} tabletLg={{ col: 12 }}>
              <ReasonList
                filters={filtersToApply}
              />
            </Grid>
            <Grid desktop={{ col: 7 }} tabletLg={{ col: 12 }}>
              <TotalHrsAndRecipient
                filters={filtersToApply}
              />
            </Grid>
          </Grid>
          <Grid row>
            <TopicFrequencyGraph
              filters={filtersToApply}
            />
          </Grid>
          <Grid row>
            <ActivityReportsTable
              filters={filtersToApply}
              showFilter={false}
              tableCaption="Activity reports"
            />
          </Grid>
        </GridContainer>
      </>
    </div>

  );
}

RegionalDashboard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    role: PropTypes.arrayOf(PropTypes.string),
    homeRegionId: PropTypes.number,
    permissions: PropTypes.arrayOf(PropTypes.shape({
      userId: PropTypes.number,
      scopeId: PropTypes.number,
      regionId: PropTypes.number,
    })),
  }),
};

RegionalDashboard.defaultProps = {
  user: null,
};
