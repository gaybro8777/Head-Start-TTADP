import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import fetchMock from 'fetch-mock';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import RecipientRecord from '../index';
import { formatDateRange } from '../../../utils';
import UserContext from '../../../UserContext';
import { SCOPE_IDS } from '../../../Constants';
import AppLoadingContext from '../../../AppLoadingContext';

const { ADMIN } = SCOPE_IDS;
const yearToDate = encodeURIComponent(formatDateRange({ yearToDate: true, forDateTime: true }));
const memoryHistory = createMemoryHistory();

describe('recipient record page', () => {
  const user = {
    id: 2,
    permissions: [
      {
        scopeId: ADMIN,
      },
      {
        regionId: 45,
        userId: 2,
        scopeId: 1,
      },
      {
        regionId: 45,
        userId: 2,
        scopeId: 2,
      },
      {
        regionId: 45,
        userId: 2,
        scopeId: 3,
      },
    ],
  };

  const theMightyRecipient = {
    name: 'the Mighty Recipient',
    grants: [
      {
        name: 'Grant Name 1',
        number: 'RECIPIENT_NUMBER',
        status: 'Active',
        startDate: null,
        endDate: null,
        id: 10,
        regionId: 45,
        programSpecialistName: 'The Mighty Program Specialist',
        recipientId: 9,
        numberWithProgramTypes: 'RECIPIENT_NUMBER EHS',
      },
    ],
  };

  const mockGoal = {
    name: 'This is a goal name',
    status: 'In Progress',
    endDate: '10/08/2021',
    grant: {
      id: 1,
      number: '1',
      programs: [{
        programType: 'EHS',
      }],
      status: 'Active',
    },
    objectives: [
      {
        id: 1238474,
        title: 'This is an objective',
        status: 'Not Started',
        resources: [],
        topics: [],
        activityReports: [],
        roles: [],
      },
    ],
  };

  function renderRecipientRecord(history = memoryHistory, regionId = '45') {
    const match = {
      path: '',
      url: '',
      params: {
        recipientId: '1',
        regionId,
      },
    };

    render(
      <Router history={history}>
        <UserContext.Provider value={{ user }}>
          <AppLoadingContext.Provider value={
          {
            setIsAppLoading: jest.fn(),
            setAppLoadingText: jest.fn(),
            isAppLoading: false,
          }
        }
          >
            <RecipientRecord match={match} />
          </AppLoadingContext.Provider>
        </UserContext.Provider>
      </Router>,
    );
  }

  const overview = {
    duration: '',
    deliveryMethod: '',
    numberOfParticipants: '',
    inPerson: '',
    sumDuration: '',
    numParticipants: '',
    numReports: '',
    numGrants: '',
  };

  beforeEach(() => {
    fetchMock.get('/api/user', user);
    fetchMock.get('/api/widgets/overview', overview);
    fetchMock.get('/api/widgets/overview?region.in[]=45&recipientId.ctn[]=1', overview);
    fetchMock.get(`/api/widgets/overview?startDate.win=${yearToDate}&region.in[]=45&recipientId.ctn[]=1`, overview);
    fetchMock.get('/api/activity-reports?sortBy=updatedAt&sortDir=desc&offset=0&limit=10', { count: 0, rows: [] });
    fetchMock.get(`/api/activity-reports?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&startDate.win=${yearToDate}&region.in[]=45&recipientId.ctn[]=1`, { count: 0, rows: [] });
    fetchMock.get('/api/activity-reports?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&region.in[]=45&recipientId.ctn[]=1', { count: 0, rows: [], topics: [] });
    fetchMock.get(`/api/activity-reports?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&startDate.win=${yearToDate}`, { count: 0, rows: [], topics: [] });
    fetchMock.get('/api/widgets/frequencyGraph', 200);
    fetchMock.get(`/api/widgets/frequencyGraph?startDate.win=${yearToDate}&region.in[]=45&recipientId.ctn[]=1`, 200);
    fetchMock.get('/api/widgets/frequencyGraph?region.in[]=45&recipientId.ctn[]=1', 200);
    fetchMock.get(`/api/widgets/frequencyGraph?startDate.win=${yearToDate}`, 200);
    fetchMock.get('/api/widgets/targetPopulationTable?region.in[]=45&recipientId.ctn[]=1', 200);
    fetchMock.get(`/api/widgets/targetPopulationTable?startDate.win=${yearToDate}&region.in[]=45&recipientId.ctn[]=1`, 200);
    fetchMock.get('/api/widgets/goalStatusGraph?region.in[]=45&recipientId.ctn[]=1', 200);
    fetchMock.get('/api/recipient/1/region/45/goals?sortBy=goalStatus&sortDir=asc&offset=0&limit=5', []);
    fetchMock.get('/api/recipient/1/region/45/goals?sortBy=goalStatus&sortDir=asc&offset=0&limit=10', []);
  });
  afterEach(() => {
    fetchMock.restore();
  });

  it('shows the recipient name', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    act(() => renderRecipientRecord());

    const recipientName = await screen.findByRole('heading', { level: 1 });
    expect(recipientName.textContent).toEqual('the Mighty Recipient - Region 45');
  });

  it('renders the navigation', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    act(() => renderRecipientRecord());

    const backToSearch = await screen.findByRole('link', { name: /back to search/i });
    const ttaHistory = await screen.findByRole('link', { name: /tta history/i });
    expect(backToSearch).toBeVisible();
    expect(ttaHistory).toBeVisible();
  });

  it('handles recipient not found', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', 404);
    act(() => renderRecipientRecord());
    const error = await screen.findByText('Recipient record not found');
    expect(error).toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', 500);
    act(() => renderRecipientRecord());
    const error = await screen.findByText('There was an error fetching recipient data');
    expect(error).toBeInTheDocument();
  });

  it('navigates to the profile page', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    memoryHistory.push('/recipient-tta-records/1/region/45/profile');
    act(() => renderRecipientRecord());
    const heading = await screen.findByRole('heading', { name: /recipient summary/i });
    expect(heading).toBeInTheDocument();
  });

  it('navigates to the tta history page', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    memoryHistory.push('/recipient-tta-records/1/region/45/tta-history');
    act(() => renderRecipientRecord());
    await waitFor(() => {
      const ar = screen.getByText(/the number of approved activity reports\. click to visually reveal this information/i);
      expect(ar).toBeInTheDocument();
    });

    const remove = screen.getByRole('button', {
      name: /this button removes the filter: date started is within/i,
    });

    userEvent.click(remove);
    await waitFor(() => expect(remove).not.toBeInTheDocument());
  });

  it('navigates to the goals & objectives page', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    memoryHistory.push('/recipient-tta-records/1/region/45/goals-objectives');
    act(() => renderRecipientRecord());
    await waitFor(() => expect(screen.queryByText(/loading.../)).toBeNull());
    expect(document.querySelector('#recipientGoalsObjectives')).toBeTruthy();
  });

  it('navigates to the edit goals page', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    fetchMock.get('/api/goals/12389/recipient/45', mockGoal);
    fetchMock.get('/api/topic', []);
    memoryHistory.push('/recipient-tta-records/45/region/1/goals/12389');
    act(() => renderRecipientRecord());
    await waitFor(() => expect(screen.queryByText(/loading.../)).toBeNull());
    await screen.findByText(/TTA Goals for the Mighty Recipient/i);
  });

  it('navigates to the print goals page', async () => {
    fetchMock.get('/api/recipient/1?region.in[]=45', theMightyRecipient);
    fetchMock.get('/api/recipient/1/region/45/goals?sortBy=goalStatus&sortDir=asc&offset=0&limit=false', { goalRows: [] });
    memoryHistory.push('/recipient-tta-records/45/region/1/goals-objectives/print');
    act(() => renderRecipientRecord());
    await waitFor(() => expect(screen.queryByText(/loading.../)).toBeNull());
    await screen.findByText(/TTA Goals for the Mighty Recipient/i);
  });
});
