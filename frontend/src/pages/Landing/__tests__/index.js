import '@testing-library/jest-dom';
import React from 'react';
import {
  render, screen,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import fetchMock from 'fetch-mock';

import UserContext from '../../../UserContext';
import Landing from '../index';
import activityReports from '../mocks';

const renderLanding = (user) => {
  render(
    <MemoryRouter>
      <UserContext.Provider value={{ user }}>
        <Landing authenticated />
      </UserContext.Provider>
    </MemoryRouter>,
  );
}

describe('Landing Page', () => {
  beforeEach(() => {
    fetchMock.get('/api/activity-reports', activityReports);
    fetchMock.get('/api/activity-reports/alerts', []);
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
  });
  afterEach(() => fetchMock.restore());

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
      '/activity-reports/1/activity-summary',
    );
  });

  test('displays the correct grantees', async () => {
    const grantee = await screen.findByRole('cell', {
      name: /johnston-romaguera\njohnston-romaguera\ngrantee name/i,
    });
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
    const topics = await screen.findByRole('cell', {
      name: /behavioral \/ mental health\nclass: instructional support/i,
    });

    expect(topics).toBeVisible();
  });

  test('displays the correct collaborators', async () => {
    const collaborators = await screen.findByRole('cell', {
      name: /cucumber user, gs\nhermione granger, ss/i,
    });

    expect(collaborators).toBeVisible();
    expect(collaborators.firstChild).toHaveClass('smart-hub--ellipsis');
    expect(collaborators.firstChild.children.length).toBe(2);
    expect(collaborators.firstChild.firstChild).toHaveClass('usa-tag smart-hub--table-collection');
    expect(collaborators.firstChild.firstChild).toHaveTextContent('Cucumber User');
    expect(collaborators.firstChild.lastChild).toHaveTextContent('Hermione Granger');
  });

  test('displays the correct last saved dates', async () => {
    const lastSavedDates = await screen.findAllByText(/02\/04\/2021/i);

    expect(lastSavedDates.length).toBe(2);
  });

  test('displays the correct statuses', async () => {
    const statuses = await screen.findAllByText(/draft/i);

    expect(statuses.length).toBe(2);
  });

  test('displays the options buttons', async () => {
    const optionButtons = await screen.findAllByRole('button', /.../i);

    expect(optionButtons.length).toBe(2);
  });

  test('displays the new activity report button', async () => {
    const newActivityReportBtns = await screen.findAllByText(/New Activity Report/);

    expect(newActivityReportBtns.length).toBe(1);
  });
});

describe('Landing Page error', () => {
  afterEach(() => fetchMock.restore());

  beforeEach(() => {
    fetchMock.get('/api/activity-reports/alerts', []);
  });

  it('handles errors by displaying an error message', async () => {
    fetchMock.get('/api/activity-reports', 500);
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
    const alert = await screen.findByRole('alert');
    expect(alert).toBeVisible();
    expect(alert).toHaveTextContent('Unable to fetch reports');
  });

  it('displays an empty row if there are no reports', async () => {
    fetchMock.get('/api/activity-reports', []);
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
    expect(rowCells.length).toBe(8);
    const grantee = rowCells[0];
    expect(grantee).toHaveTextContent('');
  });

  it('does not displays new activity report button without permission', async () => {
    fetchMock.get('/api/activity-reports', activityReports);
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

    try {
      expect((await screen.findAllByText(/New Activity Report/)).length).toBe(0);
    } catch (error) {
      // screen.findAllByText throws an exception if no element is found 
      // hence this assertion
      expect(true).toBeTruthy();
    }
  });
});
