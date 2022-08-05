import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import ReactRouterPropTypes from 'react-router-prop-types';
import { Alert } from '@trussworks/react-uswds';
import { getRecipientGoals } from '../../../fetchers/recipient';
import PrintableGoal from './components/PrintableGoal';
import PrintToPdf from '../../../components/PrintToPDF';
import './PrintGoals.css';
import FilterContext from '../../../FilterContext';
import useSessionFiltersAndReflectInUrl from '../../../hooks/useSessionFiltersAndReflectInUrl';
import { expandFilters, filtersToQueryString } from '../../../utils';

const OFFSET = 0;
export default function PrintGoals({ location, recipientId, regionId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  const { filterKey } = useContext(FilterContext);

  const [filters] = useSessionFiltersAndReflectInUrl(
    filterKey,
    [],
  );

  useEffect(() => {
    const sortConfig = location.state && location.state.selectedGoals
      ? location.state.selectedGoals
      : [];

    async function fetchGoals(query) {
      setLoading(true);
      try {
        const { goalRows } = await getRecipientGoals(
          recipientId,
          regionId,
          sortConfig.sortBy,
          sortConfig.direction,
          OFFSET,
          false,
          query,
        );
        setGoals(goalRows);
        setError('');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Unable to fetch goals');
      }
      setLoading(false);
    }

    const filterQuery = filtersToQueryString(expandFilters(filters));

    fetchGoals(filterQuery);
  }, [location.state, recipientId, regionId, filters, filterKey]);

  if (loading) {
    return 'Loading...';
  }

  if (!goals.length) {
    return (
      <Alert type="info" headingLevel="h2" heading={<>Something went wrong</>}>
        <span className="usa-prose">Select goals before printing.</span>
      </Alert>
    );
  }

  return (
    <div className="margin-top-2 margin-left-2 ttahub-print-goals">
      <PrintToPdf />
      <div className="bg-white radius-md shadow-2 margin-right-2">
        {goals.map((goal) => <PrintableGoal key={goal.id} goal={goal} />)}
      </div>
    </div>
  );
}

PrintGoals.propTypes = {
  location: ReactRouterPropTypes.location.isRequired,
  recipientId: PropTypes.string.isRequired,
  regionId: PropTypes.string.isRequired,
};
