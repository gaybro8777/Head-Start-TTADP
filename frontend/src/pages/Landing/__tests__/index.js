/* eslint-disable jest/no-disabled-tests */
import '@testing-library/jest-dom';
import React from 'react';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import fetchMock from 'fetch-mock';

import userEvent from '@testing-library/user-event';
import UserContext from '../../../UserContext';
import AriaLiveContext from '../../../AriaLiveContext';
import Landing from '../index';
import activityReports, { activityReportsSorted, generateXFakeReports, overviewRegionOne } from '../mocks';
import { getAllAlertsDownloadURL } from '../../../fetchers/helpers';

jest.mock('../../../fetchers/helpers');

const mockAnnounce = jest.fn();

const withRegionOne = '&region.in[]=1';
const withAllRegions = '&region.in[]=14';
const base = '/api/activity-reports?sortBy=updatedAt&sortDir=desc&offset=0&limit=10';
const baseAlerts = '/api/activity-reports/alerts?sortBy=startDate&sortDir=desc&offset=0&limit=10';
const defaultBaseAlertsUrl = `${baseAlerts}${withAllRegions}`;
const defaultBaseUrl = `${base}${withAllRegions}`;
const defaultBaseAlertsUrlWithRegionOne = `${baseAlerts}${withRegionOne}`;
const defaultBaseUrlWithRegionOne = `${base}${withRegionOne}`;
const defaultOverviewUrl = '/api/widgets/overview';
const overviewUrlWithRegionOne = `${defaultOverviewUrl}?region.in[]=1&startDate.aft=2020/08/31`;
const overviewUrlWithAllRegions = `${defaultOverviewUrl}?region.in[]=14&startDate.aft=2020/08/31`;

const mockFetchWithRegionOne = () => {
  fetchMock.get(defaultBaseUrlWithRegionOne, { count: 2, rows: activityReports });
  fetchMock.get(defaultBaseAlertsUrlWithRegionOne, {
    alertsCount: 0,
    alerts: [],
  });
  fetchMock.get(overviewUrlWithRegionOne, overviewRegionOne);
};

const renderLanding = (user) => {
  render(
    <MemoryRouter>
      <AriaLiveContext.Provider value={{ announce: mockAnnounce }}>
        <UserContext.Provider value={{ user }}>
          <Landing authenticated user={user} />
        </UserContext.Provider>
      </AriaLiveContext.Provider>
    </MemoryRouter>,
  );
};

describe('Landing Page', () => {
  beforeEach(async () => {
    fetchMock.get(defaultBaseUrl, { count: 2, rows: activityReports });
    fetchMock.get(defaultBaseUrlWithRegionOne, { count: 2, rows: activityReports });
    fetchMock.get(defaultBaseAlertsUrlWithRegionOne, {
      alertsCount: 0,
      alerts: [],
    });
    fetchMock.get(defaultBaseAlertsUrl, {
      alertsCount: 0,
      alerts: [],
    });
    fetchMock.get(overviewUrlWithRegionOne, overviewRegionOne);

    const user = {
      name: 'test@test.com',
      permissions: [
        {
          scopeId: 3,
          regionId: 1,
        },
      ],
    };

    renderLanding(user);
    await screen.findByText('Activity Reports');
  });
  afterEach(() => fetchMock.restore());

  test('displays a dismissable alert with a status message for a report, if provided', async () => {
    const user = {
      name: 'test@test.com',
      homeRegionId: 1,
      permissions: [
        {
          scopeId: 3,
          regionId: 1,
        },
      ],
    };
    const message = {
      status: 'TESTED',
      displayId: 'R14-AR-1',
      time: 'today',
    };

    const pastLocations = [
      { pathname: '/activity-reports/1', state: { message } },
    ];

    await render(
      <MemoryRouter initialEntries={pastLocations}>
        <UserContext.Provider value={{ user }}>
          <Landing authenticated user={user} />
        </UserContext.Provider>
      </MemoryRouter>,
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeVisible();

    const alertButton = await screen.findByLabelText(/dismiss alert/i);
    expect(alertButton).toBeVisible();

    fireEvent.click(alertButton);

    // https://testing-library.com/docs/guide-disappearance#waiting-for-disappearance
    await waitFor(() => {
      expect(screen.queryByText(/you successfully tested report R14-AR-1 on today/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/dismiss alert/i)).not.toBeInTheDocument();
    });
  });

  test('displays activity reports heading', async () => {
    expect(await screen.findByText('Activity Reports')).toBeVisible();
  });

  test('displays report id column', async () => {
    const reportIdColumnHeader = await screen.findByRole('columnheader', {
      name: /report id/i,
    });
    expect(reportIdColumnHeader).toBeVisible();
  });

  test('displays grantee column', async () => {
    const granteeColumnHeader = await screen.findByRole('columnheader', {
      name: /grantee/i,
    });
    expect(granteeColumnHeader).toBeVisible();
  });

  test('displays start date column', async () => {
    const startDateColumnHeader = await screen.findByRole('columnheader', {
      name: /start date/i,
    });
    expect(startDateColumnHeader).toBeVisible();
  });

  test('displays creator column', async () => {
    const creatorColumnHeader = await screen.findByRole('columnheader', {
      name: /creator/i,
    });
    expect(creatorColumnHeader).toBeVisible();
  });

  test('displays topics column', async () => {
    const topicsColumnHeader = await screen.findByRole('columnheader', {
      name: /topic\(s\)/i,
    });
    expect(topicsColumnHeader).toBeVisible();
  });

  test('displays the correct report id', async () => {
    const reportIdLink = await screen.findByRole('link', {
      name: /r14-ar-1/i,
    });

    expect(reportIdLink).toBeVisible();
    expect(reportIdLink.closest('a')).toHaveAttribute(
      'href',
      '/activity-reports/1',
    );
  });

  test('displays the correct grantees', async () => {
    const grantee = await screen.findByRole('button', { name: /johnston-romaguera johnston-romaguera grantee name click to visually reveal the recipients for r14-ar-1/i });
    const nonGrantee = await screen.findByRole('cell', {
      name: /qris system/i,
    });

    expect(grantee).toBeVisible();
    expect(nonGrantee).toBeVisible();
  });

  test('displays the correct start date', async () => {
    const startDate = await screen.findByRole('cell', {
      name: /02\/08\/2021/i,
    });

    expect(startDate).toBeVisible();
  });

  test('displays the correct topics', async () => {
    const topics = await screen.findByRole('button', { name: /behavioral \/ mental health class: instructional support click to visually reveal the topics for r14-ar-1/i });

    expect(topics).toBeVisible();
    expect(topics.firstChild).toHaveClass('smart-hub--ellipsis');
    expect(topics.firstChild.firstChild.firstChild).toHaveClass('smart-hub--tooltip-truncated');
    expect(topics.firstChild).toHaveTextContent('Behavioral / Mental Health CLASS: Instructional Support');
  });

  test('displays the correct collaborators', async () => {
    const collaborators = await screen.findByRole('cell', { name: /orange, gs hermione granger, ss click to visually reveal the collaborators for r14-ar-1/i });
    expect(collaborators).toBeVisible();
    expect(collaborators.firstChild).toHaveClass('smart-hub--tooltip');
    expect(collaborators.firstChild.children.length).toBe(2);
    const truncated = collaborators.firstChild.children[1].firstChild.firstChild.firstChild;
    expect(truncated).toHaveClass('smart-hub--tooltip-truncated');
    expect(truncated).toHaveTextContent('Orange, GS');
  });

  test('displays the correct last saved dates', async () => {
    const lastSavedDates = await screen.findAllByText(/02\/04\/2021/i);

    expect(lastSavedDates.length).toBe(1);
  });

  test('displays the options buttons', async () => {
    const optionButtons = await screen.findAllByRole('button', {
      name: /actions for activity report r14-ar-2/i,
    });

    expect(optionButtons.length).toBe(1);
  });

  test('displays the new activity report button', async () => {
    const newActivityReportBtns = await screen.findAllByText(/New Activity Report/);

    expect(newActivityReportBtns.length).toBe(1);
  });
});

describe('Landing page table menus & selections', () => {
  describe('download all alerts button', () => {
    describe('downloads all alerts', () => {
      afterAll(() => {
        getAllAlertsDownloadURL.mockClear();
      });

      beforeAll(async () => {
        fetchMock.reset();
        fetchMock.get(
          defaultBaseAlertsUrlWithRegionOne,
          { count: 10, alerts: generateXFakeReports(10) },
        );
        fetchMock.get(
          defaultBaseUrlWithRegionOne,
          { count: 10, rows: [] },
        );
        fetchMock.get(overviewUrlWithRegionOne, overviewRegionOne);
      });

      it('downloads all reports', async () => {
        const user = {
          name: 'test@test.com',
          permissions: [
            {
              scopeId: 3,
              regionId: 1,
            },
            {
              scopeId: 2,
              regionId: 1,
            },
          ],
        };

        renderLanding(user);
        const reportMenu = await screen.findByLabelText(/my alerts report menu/i);
        userEvent.click(reportMenu);
        const downloadButton = await screen.findByRole('menuitem', { name: /export table data/i });
        userEvent.click(downloadButton);
        expect(getAllAlertsDownloadURL).toHaveBeenCalledWith('region.in[]=1');
      });
    });
  });
});

describe('My alerts sorting', () => {
  afterEach(() => fetchMock.restore());

  beforeEach(async () => {
    fetchMock.reset();
    fetchMock.get(defaultBaseAlertsUrl, {
      alertsCount: 2,
      alerts: activityReports,
    });
    fetchMock.get(defaultBaseUrl, { count: 0, rows: [] });
    fetchMock.get(defaultBaseAlertsUrlWithRegionOne, {
      alertsCount: 2,
      alerts: activityReports,
    });
    fetchMock.get(defaultBaseUrlWithRegionOne, { count: 0, rows: [] });
    fetchMock.get(overviewUrlWithRegionOne, overviewRegionOne);
    fetchMock.get(overviewUrlWithAllRegions, overviewRegionOne);
    fetchMock.get(defaultOverviewUrl, overviewRegionOne);
    const user = {
      name: 'test@test.com',
      homeRegionId: 1,
      permissions: [
        {
          scopeId: 3,
          regionId: 1,
        },
        {
          scopeId: 2,
          regionId: 1,
        },
      ],
    };

    renderLanding(user);
    await screen.findByText('Activity Reports');
  });

  it('is enabled for Status', async () => {
    const statusColumnHeaders = await screen.findAllByText(/status/i);

    expect(statusColumnHeaders.length).toBe(1);
    fetchMock.reset();

    fireEvent.click(statusColumnHeaders[0]);

    await waitFor(() => expect(screen.getAllByRole('cell')[7]).toHaveTextContent(/draft/i));
    await waitFor(() => expect(screen.getAllByRole('cell')[16]).toHaveTextContent(/needs action/i));

    fetchMock.get('/api/activity-reports/alerts?sortBy=calculatedStatus&sortDir=desc&offset=0&limit=10&region.in[]=1',
      { alertsCount: 2, alerts: activityReportsSorted });

    fireEvent.click(statusColumnHeaders[0]);
    await waitFor(() => expect(screen.getAllByRole('cell')[7]).toHaveTextContent(/needs action/i));
    await waitFor(() => expect(screen.getAllByRole('cell')[16]).toHaveTextContent(/draft/i));
  });

  it('is enabled for Report ID', async () => {
    const columnHeaders = await screen.findAllByText(/report id/i);

    expect(columnHeaders.length).toBe(2);
    fetchMock.reset();
    fetchMock.get('/api/activity-reports/alerts?sortBy=regionId&sortDir=asc&offset=0&limit=10&region.in[]=1',
      { alertsCount: 2, alerts: activityReports });
    fetchMock.get(
      defaultBaseUrl,
      { count: 0, rows: [] },
    );

    fireEvent.click(columnHeaders[0]);
    await waitFor(() => expect(screen.getAllByRole('cell')[0]).toHaveTextContent(/r14-ar-1/i));
    await waitFor(() => expect(screen.getAllByRole('cell')[9]).toHaveTextContent(/r14-ar-2/i));
  });

  it('is enabled for Grantee', async () => {
    const columnHeaders = await screen.findAllByRole('button', {
      name: /grantee\. activate to sort ascending/i,
    });
    expect(columnHeaders.length).toBe(2);
    fetchMock.reset();
    fetchMock.get('/api/activity-reports/alerts?sortBy=activityRecipients&sortDir=asc&offset=0&limit=10&region.in[]=1',
      { alertsCount: 2, alerts: activityReports });
    fetchMock.get(
      defaultBaseUrl,
      { count: 0, rows: [] },
    );

    fireEvent.click(columnHeaders[0]);

    const textContent = /Johnston-Romaguera Johnston-Romaguera Grantee Name click to visually reveal the recipients for R14-AR-1$/i;
    await waitFor(() => expect(screen.getAllByRole('cell')[1]).toHaveTextContent(textContent));
    await waitFor(() => expect(screen.getAllByRole('cell')[10]).toHaveTextContent(/qris system/i));
  });

  it('is enabled for Start date', async () => {
    const columnHeaders = await screen.findAllByText(/start date/i);

    expect(columnHeaders.length).toBe(2);
    fetchMock.reset();
    fetchMock.get('/api/activity-reports/alerts?sortBy=startDate&sortDir=asc&offset=0&limit=10&region.in[]=1',
      { alertsCount: 2, alerts: activityReportsSorted });
    fetchMock.get(
      defaultBaseUrl,
      { count: 0, rows: [] },
    );

    fireEvent.click(columnHeaders[0]);

    await waitFor(() => expect(screen.getAllByRole('cell')[2]).toHaveTextContent(/02\/01\/2021/i));
    await waitFor(() => expect(screen.getAllByRole('cell')[11]).toHaveTextContent(/02\/08\/2021/i));
  });

  it('is enabled for Creator', async () => {
    const columnHeaders = await screen.findAllByText(/creator/i);

    expect(columnHeaders.length).toBe(2);
    fetchMock.reset();
    fetchMock.get('/api/activity-reports/alerts?sortBy=author&sortDir=asc&offset=0&limit=10&region.in[]=1',
      { alertsCount: 2, alerts: activityReportsSorted });
    fetchMock.get(
      defaultBaseUrl,
      { count: 0, rows: [] },
    );

    fireEvent.click(columnHeaders[0]);

    await waitFor(() => expect(screen.getAllByRole('cell')[3]).toHaveTextContent(/kiwi, gs/i));
    await waitFor(() => expect(screen.getAllByRole('cell')[12]).toHaveTextContent(/kiwi, ttac/i));
  });

  it('is enabled for Collaborator(s)', async () => {
    const columnHeaders = await screen.findAllByText(/collaborator\(s\)/i);
    expect(columnHeaders.length).toBe(2);
    fetchMock.reset();
    fetchMock.get(`/api/activity-reports/alerts?sortBy=collaborators&sortDir=asc&offset=0&limit=10${withRegionOne}`,
      { alertsCount: 2, alerts: activityReportsSorted });
    fetchMock.get(`${defaultBaseUrl}${withRegionOne}`, { count: 0, rows: [] });

    fireEvent.click(columnHeaders[0]);

    const firstCell = /Cucumber User, GS Hermione Granger, SS click to visually reveal the collaborators for R14-AR-2$/i;
    const secondCell = /Orange, GS Hermione Granger, SS click to visually reveal the collaborators for R14-AR-1$/i;
    await waitFor(() => expect(screen.getAllByRole('cell')[5]).toHaveTextContent(firstCell));
    await waitFor(() => expect(screen.getAllByRole('cell')[14]).toHaveTextContent(secondCell));
  });
});

describe('Landing Page error', () => {
  afterEach(() => fetchMock.restore());

  beforeEach(() => {
    mockFetchWithRegionOne();
    fetchMock.get(overviewUrlWithAllRegions, overviewRegionOne);
    fetchMock.get(defaultOverviewUrl, overviewRegionOne);
    fetchMock.get(base, { count: 0, rows: [] });
    fetchMock.get(baseAlerts, { alertsCount: 0, alerts: [] });
  });

  it('handles errors by displaying an error message', async () => {
    fetchMock.get(defaultBaseUrl, 500);
    fetchMock.get(defaultBaseAlertsUrl, { alertsCount: 0, alerts: [] });
    const user = {
      name: 'test@test.com',
      homeRegionId: 14,
      permissions: [
        {
          scopeId: 3,
          regionId: 1,
        },
      ],
    };
    renderLanding(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent('Unable to fetch reports');
  });

  it('displays an empty row if there are no reports', async () => {
    fetchMock.get(
      defaultBaseUrl,
      { count: 0, rows: [] },
    );
    const user = {
      name: 'test@test.com',
      permissions: [
        {
          scopeId: 3,
          regionId: 1,
        },
      ],
    };
    renderLanding(user);
    const rowCells = await screen.findAllByRole('cell');
    expect(rowCells.length).toBe(10);
    const grantee = rowCells[1];
    expect(grantee).toHaveTextContent('');
  });

  it('does not displays new activity report button without permission', async () => {
    fetchMock.get(
      defaultBaseUrl,
      { count: 2, rows: activityReports },
    );
    const user = {
      name: 'test@test.com',
      permissions: [
        {
          scopeId: 2,
          regionId: 1,
        },
      ],
    };
    renderLanding(user);

    await expect(screen.findAllByText(/New Activity Report/)).rejects.toThrow();
  });
});

describe('handleApplyFilters', () => {
  beforeEach(() => {
    mockFetchWithRegionOne();
    fetchMock.get(defaultBaseAlertsUrl, { count: 0, rows: [] });
    fetchMock.get(defaultBaseUrl, { count: 2, rows: activityReports });
    fetchMock.get(overviewUrlWithAllRegions, overviewRegionOne);
    fetchMock.get(defaultOverviewUrl, overviewRegionOne);
    fetchMock.get(base, { count: 0, rows: [] });
    fetchMock.get(baseAlerts, { alertsCount: 0, alerts: [] });
  });

  afterEach(() => fetchMock.restore());

  it('calls AriaLiveContext.announce', async () => {
    const user = {
      name: 'test@test.com',
      homeRegionId: 1,
      permissions: [
        {
          scopeId: 2,
          regionId: 1,
        },
      ],
    };
    renderLanding(user);
    // Only one button exists only because there are no alerts
    const filterMenuButton = await screen.findByRole('button', { name: /filters/i });
    fireEvent.click(filterMenuButton);
    const addFilterButton = await screen.findByRole('button', { name: /add new filter/i });
    fireEvent.click(addFilterButton);

    const topic = await screen.findByRole('combobox', { name: 'topic' });
    userEvent.selectOptions(topic, 'reportId');

    const condition = await screen.findByRole('combobox', { name: 'condition' });
    userEvent.selectOptions(condition, 'Contains');

    fetchMock.get('/api/activity-reports?sortBy=updatedAt&sortDir=desc&offset=0&limit=10&reportId.in[]=test', { count: 0, rows: [] });
    const query = await screen.findByRole('textbox');
    userEvent.type(query, 'test');

    const apply = await screen.findByRole('button', { name: 'Apply Filters' });
    userEvent.click(apply);

    expect(mockAnnounce).toHaveBeenCalled();
    // wait for everything to finish loading
    await waitFor(() => expect(screen.queryByText(/Loading data/i)).toBeNull());
  });
});

describe('handleApplyAlertFilters', () => {
  beforeEach(() => {
    fetchMock.get(defaultBaseAlertsUrlWithRegionOne, {
      count: 10,
      alerts: generateXFakeReports(10),
    });
    fetchMock.get(defaultBaseUrlWithRegionOne, { count: 1, rows: generateXFakeReports(1) });
    fetchMock.get(overviewUrlWithRegionOne, overviewRegionOne);
  });

  afterEach(() => fetchMock.restore());

  it('calls AriaLiveContext.announce', async () => {
    const user = {
      name: 'test@test.com',
      homeRegionId: 1,
      permissions: [
        {
          scopeId: 3,
          regionId: 1,
        },
      ],
    };
    renderLanding(user);

    await screen.findByText(/My activity report alerts/i);
    // Both alerts and AR tables' buttons should appear
    const allFilterButtons = await screen.findAllByRole('button', { name: /filters/i });
    expect(allFilterButtons.length).toBe(2);

    const filterMenuButton = allFilterButtons[0];
    fireEvent.click(filterMenuButton);
    const addFilterButton = await screen.findByRole('button', { name: /add new filter/i });
    fireEvent.click(addFilterButton);

    const topic = await screen.findByRole('combobox', { name: 'topic' });
    userEvent.selectOptions(topic, 'reportId');

    const condition = await screen.findByRole('combobox', { name: 'condition' });
    userEvent.selectOptions(condition, 'Contains');

    const query = await screen.findByRole('textbox');
    userEvent.type(query, 'test');

    fetchMock.restore();
    fetchMock.get(
      '/api/activity-reports/alerts?sortBy=startDate&sortDir=desc&offset=0&limit=10&reportId.in[]=test&region.in[]=1',
      { count: 1, rows: generateXFakeReports(1) },
    );

    const apply = await screen.findByRole('button', { name: 'Apply Filters' });
    userEvent.click(apply);

    expect(mockAnnounce).toHaveBeenCalled();
    // wait for everything to finish loading
    await waitFor(() => expect(screen.queryByText(/Loading data/i)).toBeNull());
  });
});
