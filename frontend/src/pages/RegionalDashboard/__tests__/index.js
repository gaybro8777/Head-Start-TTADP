import '@testing-library/jest-dom';
import React from 'react';
import join from 'url-join';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import {
  act,
  render, screen, waitFor,
} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import RegionalDashboard from '../index';
import { formatDateRange } from '../../../components/DateRangeSelect';
import { SCOPE_IDS } from '../../../Constants';
import UserContext from '../../../UserContext';

const history = createMemoryHistory();

const overViewUrl = join('api', 'widgets', 'overview');
const overViewResponse = {
  numReports: '6', numGrants: '6', numOtherEntities: '0', inPerson: '0', sumDuration: '13.0', numParticipants: '86',
};
const reasonListUrl = join('api', 'widgets', 'reasonList');
const reasonListResponse = [{ name: 'Ongoing Quality Improvement', count: 3 }];
const totalHrsAndRecipientGraphUrl = join('api', 'widgets', 'totalHrsAndRecipientGraph');
const totalHoursResponse = [{
  name: 'Hours of Training', x: ['17', '18', '23', '2', '3'], y: [1.5, 0, 0, 0, 0], month: ['Nov', 'Nov', 'Nov', 'Dec', 'Dec'],
}, {
  name: 'Hours of Technical Assistance', x: ['17', '18', '23', '2', '3'], y: [0, 0, 2.5, 2.5, 0], month: ['Nov', 'Nov', 'Nov', 'Dec', 'Dec'],
}, {
  name: 'Hours of Both', x: ['17', '18', '23', '2', '3'], y: [1.5, 1.5, 0, 0, 3.5], month: ['Nov', 'Nov', 'Nov', 'Dec', 'Dec'],
}];
const topicFrequencyGraphUrl = join('api', 'widgets', 'topicFrequencyGraph');
const topicFrequencyResponse = [{ topic: 'Behavioral / Mental Health / Trauma', count: 0 }, { topic: 'Child Assessment, Development, Screening', count: 0 }];
const activityReportsUrl = join('api', 'activity-reports');
const activityReportsResponse = { count: 0, rows: [] };

const lastThirtyDays = formatDateRange({
  lastThirtyDays: true,
  forDateTime: true,
});

const lastThirtyDaysParams = `startDate.win=${encodeURIComponent(lastThirtyDays)}`;
const regionInParams = 'region.in[]=1';

describe('Regional Dashboard page', () => {
  beforeEach(async () => {
    fetchMock.get(overViewUrl, overViewResponse);
    fetchMock.get(reasonListUrl, reasonListResponse);
    fetchMock.get(totalHrsAndRecipientGraphUrl, totalHoursResponse);
    fetchMock.get(topicFrequencyGraphUrl, topicFrequencyResponse);
    fetchMock.get(`${activityReportsUrl}?sortBy=updatedAt&sortDir=desc&offset=0&limit=10`, activityReportsResponse);
  });

  afterEach(async () => {
    fetchMock.restore();
  });

  const renderDashboard = (user) => {
    render(
      <UserContext.Provider value={{ user }}>
        <Router history={history}>
          <RegionalDashboard user={user} />
        </Router>
      </UserContext.Provider>,
    );
  };

  it('shows a heading', async () => {
    const user = {
      homeRegionId: 14,
      permissions: [{
        regionId: 1,
        scopeId: SCOPE_IDS.READ_ACTIVITY_REPORTS,
      }, {
        regionId: 1,
        scopeId: SCOPE_IDS.READ_ACTIVITY_REPORTS,
      }],
    };

    fetchMock.get(`${overViewUrl}?${lastThirtyDaysParams}`, overViewResponse);
    fetchMock.get(`${reasonListUrl}?${lastThirtyDaysParams}`, reasonListResponse);
    fetchMock.get(`${totalHrsAndRecipientGraphUrl}?${lastThirtyDaysParams}`, totalHoursResponse);
    fetchMock.get(`${topicFrequencyGraphUrl}?${lastThirtyDaysParams}`, topicFrequencyResponse);
    fetchMock.get(`${activityReportsUrl}?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&${lastThirtyDaysParams}`, activityReportsResponse);

    fetchMock.get(`${overViewUrl}?${regionInParams}`, overViewResponse);
    fetchMock.get(`${reasonListUrl}?${regionInParams}`, reasonListResponse);
    fetchMock.get(`${totalHrsAndRecipientGraphUrl}?${regionInParams}`, totalHoursResponse);
    fetchMock.get(`${topicFrequencyGraphUrl}?${regionInParams}`, topicFrequencyResponse);
    fetchMock.get(`${activityReportsUrl}?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&${regionInParams}`, activityReportsResponse);

    renderDashboard(user);
    let heading = await screen.findByText(/regional tta activity dashboard/i);
    expect(heading).toBeVisible();

    const remove = await screen.findByRole('button', { name: /This button removes the filter/i });
    act(() => userEvent.click(remove));

    const open = await screen.findByRole('button', { name: /open filters for this page/i });
    act(() => userEvent.click(open));

    const addNew = await screen.findByRole('button', { name: /add new filter/i });
    act(() => userEvent.click(addNew));

    const [lastTopic] = Array.from(document.querySelectorAll('[name="topic"]')).slice(-1);
    act(() => userEvent.selectOptions(lastTopic, 'region'));

    const [lastCondition] = Array.from(document.querySelectorAll('[name="condition"]')).slice(-1);
    act(() => userEvent.selectOptions(lastCondition, 'Is'));

    const select = await screen.findByRole('combobox', { name: 'Select region to filter by' });
    act(() => userEvent.selectOptions(select, 'Region 1'));

    const apply = await screen.findByRole('button', { name: /apply filters for regional dashboard/i });
    act(() => userEvent.click(apply));

    heading = await screen.findByText(/region 1 tta activity dashboard/i);
    expect(heading).toBeVisible();
  });

  it('shows the reason list widget', async () => {
    fetchMock.get(`${overViewUrl}?${regionInParams}`, overViewResponse);
    fetchMock.get(`${reasonListUrl}?${regionInParams}`, reasonListResponse);
    fetchMock.get(`${totalHrsAndRecipientGraphUrl}?${regionInParams}`, totalHoursResponse);
    fetchMock.get(`${topicFrequencyGraphUrl}?${regionInParams}`, topicFrequencyResponse);
    fetchMock.get(`${activityReportsUrl}?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&${regionInParams}`, activityReportsResponse);

    const user = {
      homeRegionId: 1,
      permissions: [{
        regionId: 1,
        scopeId: SCOPE_IDS.READ_ACTIVITY_REPORTS,
      }],
    };
    // fetchMock.get(userUrl, user);
    renderDashboard(user);

    await waitFor(() => {
      expect(screen.getByText(/reasons in activity reports/i)).toBeInTheDocument();
    });
  });
});
