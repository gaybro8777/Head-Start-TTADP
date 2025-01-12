import { Op } from 'sequelize';
import faker from '@faker-js/faker';
import filtersToScopes from '../index';
import { auditLogger } from '../../logger';

import db, {
  ActivityReport,
  ActivityReportApprover,
  ActivityRecipient,
  User,
  Recipient,
  Grant,
  ActivityReportCollaborator,
  OtherEntity,
  Program,
  Role,
  UserRole,
} from '../../models';
import { REPORT_STATUSES, APPROVER_STATUSES } from '../../constants';
import { createReport, destroyReport, createGrant } from '../../testUtils';

const mockUser = {
  id: faker.datatype.number(),
  homeRegionId: 1,
  name: 'user13706689',
  hsesUsername: 'user13706689',
  hsesUserId: 'user13706689',
};

const mockUserTwo = {
  id: faker.datatype.number(),
  homeRegionId: 1,
  name: 'user137065478',
  hsesUsername: 'user137065478',
  hsesUserId: 'user137065478',
};

const mockManager = {
  id: faker.datatype.number(),
  homeRegionId: 1,
  name: 'user50565590',
  hsesUsername: 'user50565590',
  hsesUserId: 'user50565590',
};

const draftReport = {
  submissionStatus: REPORT_STATUSES.DRAFT,
  userId: mockUser.id,
  regionId: 1,
};

const submittedReport = {
  ...draftReport,
  submissionStatus: REPORT_STATUSES.SUBMITTED,
  numberOfParticipants: 1,
  deliveryMethod: 'method',
  duration: 0,
  endDate: '2000-01-01T12:00:00Z',
  startDate: '2000-01-01T12:00:00Z',
  requester: 'requester',
  targetPopulations: ['Children with Disabilities', 'Infants and Toddlers (ages birth to 3)'],
  reason: ['reason'],
  participants: ['participants'],
  topics: ['topics'],
  ttaType: ['type'],
};

const approvedReport = {
  ...submittedReport,
  calculatedStatus: REPORT_STATUSES.APPROVED,
};

// Included to test default scope
const deletedReport = {
  submissionStatus: REPORT_STATUSES.DELETED,
  userId: mockUser.id,
  regionId: 1,
};

const approverApproved = {
  userId: mockManager.id,
  status: APPROVER_STATUSES.APPROVED,
  note: 'great work',
};

const approverRejected = {
  userId: mockManager.id,
  status: APPROVER_STATUSES.NEEDS_ACTION,
  note: 'change x, y, z',
};

describe('filtersToScopes', () => {
  let globallyExcludedReport;
  let includedUser1;
  let includedUser2;
  let excludedUser;

  beforeAll(async () => {
    await User.create(mockUser);
    await User.create(mockUserTwo);
    await User.create(mockManager);
    includedUser1 = await User.create({
      name: 'person', hsesUserId: 'user111', hsesUsername: 'user111',
    });
    includedUser2 = await User.create({ name: 'another person', hsesUserId: 'user222', hsesUsername: 'user222' });
    excludedUser = await User.create({ name: 'excluded', hsesUserId: 'user333', hsesUsername: 'user333' });
    globallyExcludedReport = await ActivityReport.create({
      ...draftReport, updatedAt: '2000-01-01',
    }, {
      silent: true,
    });
  });

  afterAll(async () => {
    const userIds = [
      mockUser.id,
      mockUserTwo.id,
      mockManager.id,
      includedUser1.id,
      includedUser2.id,
      excludedUser.id];
    const reports = await ActivityReport.unscoped().findAll({
      where: {
        userId: userIds,
      },
    });
    const ids = reports.map((report) => report.id);
    await ActivityReportApprover.destroy({ where: { activityReportId: ids }, force: true });
    await ActivityReport.unscoped().destroy({ where: { id: ids } });
    await User.destroy({
      where: {
        id: userIds,
      },
    });
    await db.sequelize.close();
  });

  describe('reportId', () => {
    let reportIncluded;
    let reportIncludedLegacy;
    let reportExcluded;
    let possibleIds;

    beforeAll(async () => {
      reportIncluded = await ActivityReport.create({ ...draftReport, id: 12345 });
      reportIncludedLegacy = await ActivityReport.create(
        { ...draftReport, legacyId: 'R01-AR-012345' },
      );
      reportExcluded = await ActivityReport.create({ ...draftReport, id: 12346 });
      possibleIds = [
        reportIncluded.id,
        reportIncludedLegacy.id,
        reportExcluded.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [reportIncluded.id, reportIncludedLegacy.id, reportExcluded.id] },
      });
    });

    it('included has conditions for legacy and non-legacy reports', async () => {
      const filters = { 'reportId.ctn': ['12345'] };
      const scope = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope.activityReport, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportIncluded.id, reportIncludedLegacy.id]));
    });

    it('excluded has conditions for legacy and non-legacy reports', async () => {
      const filters = { 'reportId.nctn': ['12345'] };
      const scope = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope.activityReport, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([globallyExcludedReport.id, reportExcluded.id]));
    });
  });

  describe('recipient', () => {
    describe('for otherEntities', () => {
      let reportIncluded1;
      let reportIncluded2;
      let reportExcluded;

      let otherEntityIncluded1;
      let otherEntityIncluded2;
      let otherEntityExcluded;

      let possibleIds;

      beforeAll(async () => {
        otherEntityIncluded1 = await OtherEntity.create({ id: 40, name: 'test' });
        otherEntityIncluded2 = await OtherEntity.create({ id: 41, name: 'another test' });
        otherEntityExcluded = await OtherEntity.create({ id: 42, name: 'otherEntity' });

        reportIncluded1 = await ActivityReport.create({ ...draftReport });
        reportIncluded2 = await ActivityReport.create({ ...draftReport });
        reportExcluded = await ActivityReport.create({ ...draftReport });

        await ActivityRecipient.create({
          activityReportId: reportIncluded1.id,
          otherEntityId: otherEntityIncluded1.id,
        });
        await ActivityRecipient.create({
          activityReportId: reportIncluded2.id,
          otherEntityId: otherEntityIncluded2.id,
        });
        await ActivityRecipient.create({
          activityReportId: reportExcluded.id,
          otherEntityId: otherEntityExcluded.id,
        });
        possibleIds = [
          reportIncluded1.id,
          reportIncluded2.id,
          reportExcluded.id,
          globallyExcludedReport.id,
        ];
      });

      afterAll(async () => {
        await ActivityRecipient.destroy({
          where: {
            activityReportId: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id],
          },
        });
        await ActivityReport.destroy({
          where: { id: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id] },
        });
        await OtherEntity.destroy({
          where: { id: [otherEntityIncluded1.id, otherEntityIncluded2.id, otherEntityExcluded.id] },
        });
      });

      it('includes other-entities with a partial match', async () => {
        const filters = { 'recipient.ctn': ['test'] };
        const scope = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope.activityReport, { id: possibleIds }] },
        });
        expect(found.length).toBe(2);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportIncluded1.id, reportIncluded2.id]));
      });

      it('excludes other-entities that do not partial match or have no other-entities', async () => {
        const filters = { 'recipient.nctn': ['test'] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(2);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportExcluded.id, globallyExcludedReport.id]));
      });
    });

    describe('for grants', () => {
      let reportIncluded1;
      let reportIncluded2;
      let reportExcluded;

      let recipientIncluded1;
      let recipientIncluded2;
      let recipientExcluded;

      let grantIncluded1;
      let grantIncluded2;
      let grantExcluded;

      let possibleIds;

      beforeAll(async () => {
        recipientIncluded1 = await Recipient.create({ id: 50, name: '1234', uei: 'NNA5N2KHMGN2' });
        recipientIncluded2 = await Recipient.create({ id: 51, name: 'testing 1234', uei: 'NNA5N2KHMBA2' });
        recipientExcluded = await Recipient.create({ id: 52, name: '4321', uei: 'NNA5N2KHMBC2' });

        grantIncluded1 = await Grant.create({
          id: recipientIncluded1.id, number: 1234, recipientId: recipientIncluded1.id,
        });
        grantIncluded2 = await Grant.create({
          id: recipientIncluded2.id, number: 1235, recipientId: recipientIncluded2.id,
        });
        grantExcluded = await Grant.create({
          id: recipientExcluded.id, number: 456, recipientId: recipientExcluded.id,
        });

        reportIncluded1 = await ActivityReport.create({ ...draftReport });
        reportIncluded2 = await ActivityReport.create({ ...draftReport });
        reportExcluded = await ActivityReport.create({ ...draftReport });

        await ActivityRecipient.create({
          activityReportId: reportIncluded1.id,
          grantId: grantIncluded1.id,
        });

        await ActivityRecipient.create({
          activityReportId: reportIncluded2.id,
          grantId: grantIncluded2.id,
        });

        await ActivityRecipient.create({
          activityReportId: reportExcluded.id,
          grantId: grantExcluded.id,
        });

        possibleIds = [
          reportIncluded1.id,
          reportIncluded2.id,
          reportExcluded.id,
          globallyExcludedReport.id,
        ];
      });

      afterAll(async () => {
        await ActivityRecipient.destroy({
          where: {
            activityReportId: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id],
          },
        });
        await ActivityReport.destroy({
          where: { id: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id] },
        });
        await Grant.destroy({
          where: { id: [grantIncluded1.id, grantIncluded2.id, grantExcluded.id] },
        });
        await Recipient.destroy({
          where: { id: [recipientIncluded1.id, recipientIncluded2.id, recipientExcluded.id] },
        });
      });

      it('includes recipients with a partial match', async () => {
        const filters = { 'recipient.ctn': ['1234'] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(2);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportIncluded1.id, reportIncluded2.id]));
      });

      it('excludes recipients that do not partial match or have no recipients', async () => {
        const filters = { 'recipient.nctn': ['1234'] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(2);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportExcluded.id, globallyExcludedReport.id]));
      });

      it('grant number with matches', async () => {
        const filters = { 'grantNumber.ctn': ['123'] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(2);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportIncluded1.id, reportIncluded2.id]));
      });

      it('grant number with no matches', async () => {
        const filters = { 'grantNumber.ctn': ['789'] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(0);
      });

      it('grant numbers excludes matches', async () => {
        const filters = { 'grantNumber.nctn': ['123'] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(2);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportExcluded.id, globallyExcludedReport.id]));
      });
    });

    describe('recipientId', () => {
      let reportIncluded;
      let reportExcluded;

      let recipientIncluded;
      let recipientExcluded;

      let grantIncluded;
      let grantExcluded;

      let possibleIds;

      beforeAll(async () => {
        recipientIncluded = await Recipient.create({ id: 54, name: '1234', uei: 'NNA5N2KHMGN2' });
        recipientExcluded = await Recipient.create({ id: 56, name: '4321', uei: 'NNA5N2KHMBA2' });

        grantIncluded = await Grant.create({
          id: recipientIncluded.id, number: 2234, recipientId: recipientIncluded.id,
        });
        grantExcluded = await Grant.create({
          id: recipientExcluded.id, number: 2236, recipientId: recipientExcluded.id,
        });

        reportIncluded = await ActivityReport.create({ ...draftReport });
        reportExcluded = await ActivityReport.create({ ...draftReport });

        await ActivityRecipient.create({
          activityReportId: reportIncluded.id,
          grantId: grantIncluded.id,
        });
        await ActivityRecipient.create({
          activityReportId: reportExcluded.id,
          grantId: grantExcluded.id,
        });
        possibleIds = [
          reportIncluded.id,
          reportExcluded.id,
        ];
      });

      afterAll(async () => {
        await ActivityRecipient.destroy({
          where: {
            activityReportId: [reportIncluded.id, reportExcluded.id],
          },
        });
        await ActivityReport.destroy({
          where: { id: [reportIncluded.id, reportExcluded.id] },
        });
        await Grant.destroy({
          where: { id: [grantIncluded.id, grantExcluded.id] },
        });
        await Recipient.destroy({
          where: { id: [recipientIncluded.id, recipientExcluded.id] },
        });
      });

      it('includes recipients with a matching id', async () => {
        const filters = { 'recipientId.ctn': [recipientIncluded.id] };
        const { activityReport: scope } = filtersToScopes(filters);
        const found = await ActivityReport.findAll({
          where: { [Op.and]: [scope, { id: possibleIds }] },
        });
        expect(found.length).toBe(1);
        expect(found.map((f) => f.id))
          .toEqual(expect.arrayContaining([reportIncluded.id]));
      });
    });
  });

  describe('startDate', () => {
    let firstReport;
    let secondReport;
    let thirdReport;
    let fourthReport;
    let possibleIds;

    beforeAll(async () => {
      firstReport = await ActivityReport.create({ ...draftReport, startDate: '2020-01-01' });
      secondReport = await ActivityReport.create({ ...draftReport, startDate: '2021-01-01' });
      thirdReport = await ActivityReport.create({ ...draftReport, startDate: '2022-01-01' });
      fourthReport = await ActivityReport.create({ ...draftReport, startDate: '2023-01-01' });
      possibleIds = [
        firstReport.id,
        secondReport.id,
        thirdReport.id,
        fourthReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [firstReport.id, secondReport.id, thirdReport.id, fourthReport.id] },
      });
    });

    it('before returns reports with start dates before the given date', async () => {
      const filters = { 'startDate.bef': '2021/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([firstReport.id, secondReport.id]));
    });

    it('after returns reports with start dates before the given date', async () => {
      const filters = { 'startDate.aft': '2021/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([thirdReport.id, fourthReport.id]));
    });

    it('within returns reports with start dates between the two dates', async () => {
      const filters = { 'startDate.win': '2020/06/06-2022/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([secondReport.id, thirdReport.id]));
    });

    it('within returns reports with start dates when the filters are an array', async () => {
      const filters = { 'startDate.win': ['2020/06/06-2022/06/06', '2020/06/05-2021/06/05'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([secondReport.id, thirdReport.id]));
    });
  });

  describe('lastSaved', () => {
    let firstReport;
    let secondReport;
    let thirdReport;
    let fourthReport;
    let possibleIds;

    beforeAll(async () => {
      firstReport = await ActivityReport.create({ ...draftReport, updatedAt: '2020-01-01' }, { silent: true });
      secondReport = await ActivityReport.create({ ...draftReport, updatedAt: '2021-01-01' }, { silent: true });
      thirdReport = await ActivityReport.create({ ...draftReport, updatedAt: '2022-01-01' }, { silent: true });
      fourthReport = await ActivityReport.create({ ...draftReport, updatedAt: '2023-01-01' }, { silent: true });
      possibleIds = [
        firstReport.id,
        secondReport.id,
        thirdReport.id,
        fourthReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [firstReport.id, secondReport.id, thirdReport.id, fourthReport.id] },
      });
    });

    it('before returns reports with updated ats before the given date', async () => {
      const filters = { 'lastSaved.bef': '2021/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([
          firstReport.id, secondReport.id, globallyExcludedReport.id]));
    });

    it('after returns reports with updated ats before the given date', async () => {
      const filters = { 'lastSaved.aft': '2021/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([thirdReport.id, fourthReport.id]));
    });

    it('handles an array of querys', async () => {
      const filters = { 'lastSaved.aft': ['2021/06/06', '2021/06/05'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([thirdReport.id, fourthReport.id]));
    });

    it('within returns reports with updated ats between the two dates', async () => {
      const filters = { 'lastSaved.win': '2020/06/06-2022/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([secondReport.id, thirdReport.id]));
    });
  });

  describe('creator', () => {
    let includedReport1;
    let includedReport2;
    let excludedReport;
    let possibleIds;

    beforeAll(async () => {
      includedReport1 = await ActivityReport.create({ ...draftReport, userId: includedUser1.id });
      includedReport2 = await ActivityReport.create({ ...draftReport, userId: includedUser2.id });
      excludedReport = await ActivityReport.create({ ...draftReport, userId: excludedUser.id });
      possibleIds = [
        includedReport1.id,
        includedReport2.id,
        excludedReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [includedReport1.id, includedReport2.id, excludedReport.id] },
      });
    });

    it('includes authors with a partial match', async () => {
      const filters = { 'creator.ctn': ['person'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([includedReport1.id, includedReport2.id]));
    });

    it('trims the string', async () => {
      const filters = { 'creator.ctn': [' person '] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([includedReport1.id, includedReport2.id]));
    });

    it('excludes authors that do not partial match', async () => {
      const filters = { 'creator.nctn': ['person'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([excludedReport.id, globallyExcludedReport.id]));
    });
  });

  describe('topic', () => {
    let includedReport1;
    let includedReport2;
    let excludedReport;
    let possibleIds;

    beforeAll(async () => {
      includedReport1 = await ActivityReport.create({
        ...draftReport,
        topics: ['test', 'test 2'],
      });
      includedReport2 = await ActivityReport.create({
        ...draftReport,
        topics: ['a test', 'another topic'],
      });
      excludedReport = await ActivityReport.create({ ...draftReport, topics: ['another topic'] });
      possibleIds = [
        includedReport1.id,
        includedReport2.id,
        excludedReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [includedReport1.id, includedReport2.id, excludedReport.id] },
      });
    });

    it('includes topic with a partial match', async () => {
      const filters = { 'topic.in': ['tes'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([includedReport1.id, includedReport2.id]));
    });

    it('excludes topics that do not partial match', async () => {
      const filters = { 'topic.nin': ['tes'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([excludedReport.id, globallyExcludedReport.id]));
    });
  });

  describe('collaborators', () => {
    let includedReport1;
    let includedReport2;
    let excludedReport;
    let possibleIds;

    let includedActivityReportCollaborator1;
    let includedActivityReportCollaborator2;
    let excludedActivityReportCollaborator;

    beforeAll(async () => {
      includedReport1 = await ActivityReport.create(draftReport);
      includedReport2 = await ActivityReport.create(draftReport);
      excludedReport = await ActivityReport.create(draftReport);

      includedActivityReportCollaborator1 = await ActivityReportCollaborator.create({
        activityReportId: includedReport1.id, userId: includedUser1.id,
      });
      includedActivityReportCollaborator2 = await ActivityReportCollaborator.create({
        activityReportId: includedReport2.id, userId: includedUser2.id,
      });
      excludedActivityReportCollaborator = await ActivityReportCollaborator.create({
        activityReportId: excludedReport.id, userId: excludedUser.id,
      });
      possibleIds = [
        includedReport1.id,
        includedReport2.id,
        excludedReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [includedReport1.id, includedReport2.id, excludedReport.id] },
      });
      await ActivityReportCollaborator.destroy({
        where: {
          id: [
            includedActivityReportCollaborator1.id,
            includedActivityReportCollaborator2.id,
            excludedActivityReportCollaborator.id,
          ],
        },
      });
    });

    it('includes authors with a partial match', async () => {
      const filters = { 'collaborators.ctn': ['person'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([includedReport1.id, includedReport2.id]));
    });

    it('excludes authors that do not partial match', async () => {
      const filters = { 'collaborators.nctn': ['person'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([excludedReport.id, globallyExcludedReport.id]));
    });
  });

  describe('calculatedStatus', () => {
    let includedReportMultApprover;
    let excludedReportMultApprover;
    let possibleIds;

    beforeAll(async () => {
      includedReportMultApprover = await ActivityReport.create(submittedReport);
      await ActivityReportApprover.create({
        ...approverApproved,
        activityReportId: includedReportMultApprover.id,
      });

      excludedReportMultApprover = await ActivityReport.create(submittedReport);
      await ActivityReportApprover.create({
        ...approverRejected,
        activityReportId: excludedReportMultApprover.id,
      });
      possibleIds = [
        includedReportMultApprover.id,
        excludedReportMultApprover.id,
        globallyExcludedReport.id,
      ];
    });

    it('includes statuses with a partial match', async () => {
      const filters = { 'calculatedStatus.in': ['approved'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([
          includedReportMultApprover.id,
        ]));
    });

    it('excludes statuses that do not partial match', async () => {
      const filters = { 'calculatedStatus.nin': ['app'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([
          excludedReportMultApprover.id,
          globallyExcludedReport.id,
        ]));
    });
  });

  describe('role', () => {
    const possibleIds = [faker.datatype.number(), faker.datatype.number(), faker.datatype.number()];

    beforeAll(async () => {
      const granteeSpecialist = await Role.findOne({ where: { fullName: 'Grantee Specialist' } });
      const systemSpecialist = await Role.findOne({ where: { fullName: 'System Specialist' } });
      const grantsSpecialist = await Role.findOne({ where: { fullName: 'Grants Specialist' } });

      await User.create({
        id: possibleIds[0], name: 'u777', hsesUsername: 'u777', hsesUserId: '777',
      });

      await UserRole.create({
        userId: possibleIds[0],
        roleId: granteeSpecialist.id,
      });

      await UserRole.create({
        userId: possibleIds[0],
        roleId: systemSpecialist.id,
      });

      await User.create({
        id: possibleIds[1], name: 'u778', hsesUsername: 'u778', hsesUserId: '778', role: ['Grantee Specialist'],
      });

      await UserRole.create({
        userId: possibleIds[1],
        roleId: granteeSpecialist.id,
      });

      await User.create({
        id: possibleIds[2], name: 'u779', hsesUsername: 'u779', hsesUserId: '779', role: ['Grants Specialist'],
      });

      await UserRole.create({
        userId: possibleIds[2],
        roleId: grantsSpecialist.id,
      });

      await ActivityReport.create({
        ...approvedReport, id: possibleIds[0], userId: possibleIds[0],
      });
      await ActivityReport.create({
        ...approvedReport, id: possibleIds[1], userId: possibleIds[1],
      });
      await ActivityReport.create({
        ...approvedReport, id: possibleIds[2], userId: possibleIds[2],
      });
      await ActivityReportCollaborator.create({
        id: possibleIds[0],
        activityReportId: possibleIds[1],
        userId: possibleIds[1],
      });
    });

    afterAll(async () => {
      await ActivityReportCollaborator.destroy({
        where: {
          id: possibleIds,
        },
      });
      await ActivityReport.destroy({
        where: {
          id: possibleIds,
        },
      });

      await UserRole.destroy({
        where: {
          userId: possibleIds,
        },
      });

      await User.destroy({
        where: {
          id: possibleIds,
        },
      });
    });
    it('finds reports based on author role', async () => {
      const filters = { 'role.in': ['System Specialist'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.map((f) => f.id)).toStrictEqual([possibleIds[0]]);
    });

    it('filters out reports based on author role', async () => {
      const filters = { 'role.nin': ['System Specialist'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.map((f) => f.id)).toStrictEqual([possibleIds[1], possibleIds[2]]);
    });

    it('finds reports based on collaborator role', async () => {
      const filters = { 'role.in': ['Grantee Specialist'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.map((f) => f.id)).toStrictEqual([possibleIds[0], possibleIds[1]]);
    });

    it('filters out reports based on collaborator role', async () => {
      const filters = { 'role.nin': ['Grantee Specialist'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.map((f) => f.id)).toStrictEqual([possibleIds[2]]);
    });

    it('only allows valid roles to be passed', async () => {
      let filters = { 'role.in': ['DROP * FROM *'] };
      let scope = filtersToScopes(filters);
      let found = await ActivityReport.findAll({
        where: { [Op.and]: [scope.activityReport, { id: possibleIds }] },
      });
      expect(found.map((f) => f.id)).toStrictEqual(possibleIds);

      filters = { 'role.nin': ['Grantee Specialist & Potato Salesman'] };
      scope = filtersToScopes(filters);
      found = await ActivityReport.findAll({
        where: { [Op.and]: [scope.activityReport, { id: possibleIds }] },
      });
      expect(found.map((f) => f.id)).toStrictEqual(possibleIds);
    });
  });

  describe('target population', () => {
    let reportOne;
    let reportTwo;
    let reportThree;
    let reportFour;
    let possibleIds;

    beforeAll(async () => {
      reportOne = await ActivityReport.create(submittedReport);
      reportTwo = await ActivityReport.create({
        ...submittedReport,
        targetPopulations: ['Infants and Toddlers (ages birth to 3)'],
      });
      reportThree = await ActivityReport.create({
        ...submittedReport,
        targetPopulations: ['Dual-Language Learners'],
      });
      reportFour = await ActivityReport.create({
        ...submittedReport,
        targetPopulations: [],
      });

      possibleIds = [
        reportOne.id,
        reportTwo.id,
        reportThree.id,
        reportFour.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: {
          id: possibleIds,
        },
      });
    });

    it('filters by reports containing said population', async () => {
      const filters = { 'targetPopulations.in': ['Infants and Toddlers (ages birth to 3)'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportTwo.id]));
    });

    it('filters out the appropriate population', async () => {
      const filters = { 'targetPopulations.nin': ['Infants and Toddlers (ages birth to 3)'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportThree.id, reportFour.id]));
    });

    it('only filters by possible population values', async () => {
      const filters = { 'targetPopulations.in': ['(DROP SCHEMA public CASCADE)', 'Infants and Toddlers (ages birth to 3)'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportTwo.id]));
    });

    it('filters out bad population values', async () => {
      const filters = { 'targetPopulations.in': ['(DROP SCHEMA public CASCADE)'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(4);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining(
          [reportOne.id, reportTwo.id, reportThree.id, reportFour.id],
        ));
    });
  });

  describe('reason', () => {
    let possibleIds;
    let reportOne;
    let reportTwo;
    let reportThree;
    let reportFour;

    beforeAll(async () => {
      reportOne = await ActivityReport.create({ ...approvedReport, reason: ['School Readiness Goals', 'Child Incidents'] });
      reportTwo = await ActivityReport.create({ ...approvedReport, reason: ['School Readiness Goals', 'Ongoing Quality Improvement'] });
      reportThree = await ActivityReport.create({ ...approvedReport, reason: ['COVID-19 response'] });
      reportFour = await ActivityReport.create({ ...approvedReport, reason: [] });

      possibleIds = [
        reportOne.id,
        reportTwo.id,
        reportThree.id,
        reportFour.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: {
          id: possibleIds,
        },
      });
    });

    it('returns reports with a specific reason', async () => {
      const filters = { 'reason.in': ['School Readiness Goals'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.length).toBe(2);
      expect(found.map((f) => f.id)).toEqual(expect.arrayContaining([reportOne.id, reportTwo.id]));
    });

    it('returns reports without a specific reason', async () => {
      const filters = { 'reason.nin': ['School Readiness Goals'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportThree.id, reportFour.id]));
    });

    it('only searches by allowed reasons', async () => {
      const filters = { 'reason.in': ['Pesky the Clown'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.length).toBe(4);
    });
  });

  describe('participants', () => {
    let possibleIds;
    let reportOne;
    let reportTwo;
    let reportThree;
    let reportFour;

    beforeAll(async () => {
      reportOne = await ActivityReport.create({ ...approvedReport, participants: ['Fiscal Manager/Team', 'Coach'] });
      reportTwo = await ActivityReport.create({ ...approvedReport, participants: ['HSCO', 'Regional TTA Team / Specialists'] });
      reportThree = await ActivityReport.create({ ...approvedReport, participants: ['Coach'] });
      reportFour = await ActivityReport.create({ ...approvedReport, participants: [] });

      possibleIds = [
        reportOne.id,
        reportTwo.id,
        reportThree.id,
        reportFour.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: {
          id: possibleIds,
        },
      });
    });

    it('returns reports with a specific participant', async () => {
      const filters = { 'participants.in': ['Coach'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.length).toBe(2);
      expect(
        found.map((f) => f.id),
      ).toEqual(
        expect.arrayContaining([reportOne.id, reportThree.id]),
      );
    });

    it('returns reports without a specific participiant', async () => {
      const filters = { 'participants.nin': ['Coach'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportTwo.id, reportFour.id]));
    });

    it('only searches by allowed participiant', async () => {
      const filters = { 'participants.in': ['invalid participant'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });

      expect(found.length).toBe(4);
    });
  });

  describe('program specialist', () => {
    let reportIncluded1;
    let reportIncluded2;
    let reportExcluded;

    let recipientIncluded1;
    let recipientIncluded2;
    let recipientExcluded;

    let grantIncluded1;
    let grantIncluded2;
    let grantExcluded;

    let possibleIds;

    beforeAll(async () => {
      recipientIncluded1 = await Recipient.create({ id: 120, name: 'Recipient 1 PS', uei: 'NNA5N2KHMGN2' });
      recipientIncluded2 = await Recipient.create({ id: 121, name: 'Recipient 2 PS', uei: 'NNA5N2KHMBA2' });
      recipientExcluded = await Recipient.create({ id: 122, name: 'Recipient 3 PS', uei: 'NNA5N2KHMBC2' });

      grantIncluded1 = await Grant.create({
        id: recipientIncluded1.id, number: 64968, recipientId: recipientIncluded1.id, programSpecialistName: 'Pat Bowman',
      });
      grantIncluded2 = await Grant.create({
        id: recipientIncluded2.id, number: 85248, recipientId: recipientIncluded2.id, programSpecialistName: 'Patton Blake',
      });
      grantExcluded = await Grant.create({
        id: recipientExcluded.id, number: 45877, recipientId: recipientExcluded.id, programSpecialistName: 'Jon Jones',
      });

      reportIncluded1 = await ActivityReport.create({ ...draftReport });
      reportIncluded2 = await ActivityReport.create({ ...draftReport });
      reportExcluded = await ActivityReport.create({ ...draftReport });

      await ActivityRecipient.create({
        activityReportId: reportIncluded1.id,
        grantId: grantIncluded1.id,
      });
      await ActivityRecipient.create({
        activityReportId: reportIncluded2.id,
        grantId: grantIncluded2.id,
      });
      await ActivityRecipient.create({
        activityReportId: reportExcluded.id,
        grantId: grantExcluded.id,
      });
      possibleIds = [
        reportIncluded1.id,
        reportIncluded2.id,
        reportExcluded.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityRecipient.destroy({
        where: {
          activityReportId: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id],
        },
      });
      await ActivityReport.destroy({
        where: { id: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id] },
      });
      await Grant.destroy({
        where: { id: [grantIncluded1.id, grantIncluded2.id, grantExcluded.id] },
      });
      await Recipient.destroy({
        where: { id: [recipientIncluded1.id, recipientIncluded2.id, recipientExcluded.id] },
      });
    });

    it('includes program specialist with a partial match', async () => {
      const filters = { 'programSpecialist.ctn': ['pat'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportIncluded1.id, reportIncluded2.id]));
    });

    it('excludes recipients that do not partial match or have no recipients', async () => {
      const filters = { 'programSpecialist.nctn': ['pat'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportExcluded.id, globallyExcludedReport.id]));
    });
  });

  describe('programType', () => {
    let possibleIds;
    let reportOne;
    let reportTwo;
    let reportThree;
    let grantIds;

    beforeAll(async () => {
      reportOne = await createReport({
        activityRecipients: [
          {
            grantId: faker.datatype.number(),
          },
        ],
      });
      reportTwo = await createReport({
        activityRecipients: [
          {
            grantId: faker.datatype.number(),
          },
        ],
      });
      reportThree = await createReport({
        activityRecipients: [
          {
            grantId: faker.datatype.number(),
          },
        ],
      });

      possibleIds = [
        reportOne.id,
        reportTwo.id,
        reportThree.id,
        globallyExcludedReport.id,
      ];

      const dummyProgram = {
        startYear: '2020',
        startDate: '2020-09-01',
        endDate: '2020-09-02',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const reportOneRecipients = await ActivityRecipient.findAll({
        where: {
          activityReportId: reportOne.id,
        },
      });

      const reportTwoRecipients = await ActivityRecipient.findAll({
        where: {
          activityReportId: reportTwo.id,
        },
      });

      const reportThreeRecipients = await ActivityRecipient.findAll({
        where: {
          activityReportId: reportThree.id,
        },
      });

      grantIds = [
        ...reportOneRecipients.map((r) => r.grantId),
        ...reportTwoRecipients.map((r) => r.grantId),
        ...reportThreeRecipients.map((r) => r.grantId),
      ];

      await Promise.all([
        ...reportOneRecipients.map(async (recipient) => {
          await Program.create({
            ...dummyProgram,
            id: faker.datatype.number(),
            name: faker.name.findName(),
            grantId: recipient.grantId,
            programType: 'EHS',
          }).catch((err) => auditLogger.error(err));
        }),
        ...reportTwoRecipients.map(async (recipient) => {
          await Program.create({
            ...dummyProgram,
            id: faker.datatype.number(),
            name: faker.name.findName(),
            grantId: recipient.grantId,
            programType: 'EHS',
          }).catch((err) => auditLogger.error(err));
        }),
        ...reportThreeRecipients.map(async (recipient) => {
          await Program.create({
            ...dummyProgram,
            id: faker.datatype.number(),
            name: faker.name.findName(),
            grantId: recipient.grantId,
            programType: 'HS',
          }).catch((err) => auditLogger.error(err));
        }),
      ]);
    });

    afterAll(async () => {
      await Program.destroy({
        where: {
          grantId: grantIds,
        },
      });

      await destroyReport(reportOne);
      await destroyReport(reportTwo);
      await destroyReport(reportThree);
    });

    it('includes program type', async () => {
      const filters = { 'programType.in': ['EHS', 'HS'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportTwo.id, reportThree.id]));
    });

    it('excludes program type', async () => {
      const filters = { 'programType.nin': ['EHS'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportThree.id, globallyExcludedReport.id]));
    });

    it('excludes multiple program types', async () => {
      const filters = { 'programType.nin': ['EHS', 'HS'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([globallyExcludedReport.id]));
    });
  });

  describe('myReports', () => {
    let possibleIds;
    let reportOne;
    let reportTwo;
    let reportThree;
    let grantIds;

    beforeAll(async () => {
      reportOne = await createReport({
        activityRecipients: [
          {
            grantId: faker.datatype.number(),
          },
        ],
        userId: mockUser.id,
      });

      await ActivityReportCollaborator.create({
        activityReportId: reportOne.id, userId: mockUserTwo.id,
      });

      reportTwo = await createReport({
        activityRecipients: [
          {
            grantId: faker.datatype.number(),
          },
        ],
        userId: mockUserTwo.id,
      });
      reportThree = await createReport({
        activityRecipients: [
          {
            grantId: faker.datatype.number(),
          },
        ],
      });

      await ActivityReportApprover.create({
        userId: mockUserTwo.id,
        activityReportId: reportThree.id,
      });

      possibleIds = [
        reportOne.id,
        reportTwo.id,
        reportThree.id,
        globallyExcludedReport.id,
      ];

      const dummyProgram = {
        startYear: '2020',
        startDate: '2020-09-01',
        endDate: '2020-09-02',
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const reportOneRecipients = await ActivityRecipient.findAll({
        where: {
          activityReportId: reportOne.id,
        },
      });

      const reportTwoRecipients = await ActivityRecipient.findAll({
        where: {
          activityReportId: reportTwo.id,
        },
      });

      const reportThreeRecipients = await ActivityRecipient.findAll({
        where: {
          activityReportId: reportThree.id,
        },
      });

      grantIds = [
        ...reportOneRecipients.map((r) => r.grantId),
        ...reportTwoRecipients.map((r) => r.grantId),
        ...reportThreeRecipients.map((r) => r.grantId),
      ];

      await Promise.all([
        ...reportOneRecipients.map(async (recipient) => {
          await Program.create({
            ...dummyProgram,
            id: faker.datatype.number(),
            name: faker.name.findName(),
            grantId: recipient.grantId,
            programType: 'EHS',
          }).catch((err) => auditLogger.error(err));
        }),
        ...reportTwoRecipients.map(async (recipient) => {
          await Program.create({
            ...dummyProgram,
            id: faker.datatype.number(),
            name: faker.name.findName(),
            grantId: recipient.grantId,
            programType: 'EHS',
          }).catch((err) => auditLogger.error(err));
        }),
        ...reportThreeRecipients.map(async (recipient) => {
          await Program.create({
            ...dummyProgram,
            id: faker.datatype.number(),
            name: faker.name.findName(),
            grantId: recipient.grantId,
            programType: 'HS',
          }).catch((err) => auditLogger.error(err));
        }),
      ]);
    });

    afterAll(async () => {
      await Program.destroy({
        where: {
          grantId: grantIds,
        },
      });

      await ActivityReportCollaborator.destroy({ where: { userId: mockUserTwo.id } });
      await ActivityReportApprover.destroy({
        where: { activityReportId: reportThree.id }, force: true,
      });
      await destroyReport(reportOne);
      await destroyReport(reportTwo);
      await destroyReport(reportThree);
    });

    it('includes creator my reports', async () => {
      const filters = { 'myReports.in': ['Creator'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportTwo.id]));
    });

    it('excludes creator my reports', async () => {
      const filters = { 'myReports.nin': ['Creator'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportThree.id, globallyExcludedReport.id]));
    });

    it('includes collaborator my reports', async () => {
      const filters = { 'myReports.in': ['Collaborator'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id]));
    });

    it('excludes collaborator my reports', async () => {
      const filters = { 'myReports.nin': ['Collaborator'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportTwo.id, reportThree.id, globallyExcludedReport.id]));
    });

    it('includes approver my reports', async () => {
      const filters = { 'myReports.in': ['Approver'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportThree.id]));
    });

    it('excludes approver my reports', async () => {
      const filters = { 'myReports.nin': ['Approver'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportTwo.id, globallyExcludedReport.id]));
    });

    it('includes all my reports', async () => {
      const filters = { 'myReports.in': ['Creator', 'Collaborator', 'Approver'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportTwo.id, reportThree.id]));
    });

    it('excludes all my reports', async () => {
      const filters = { 'myReports.nin': ['Creator', 'Collaborator', 'Approver'] };
      const { activityReport: scope } = filtersToScopes(
        filters,
        { userId: mockUserTwo.id },
      );
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      }).catch((err) => auditLogger.error(err));
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([globallyExcludedReport.id]));
    });
  });

  describe('defaultScope', () => {
    it('excludes deleted reports', async () => {
      const beginningARCount = await ActivityReport.count();
      const deleted = await ActivityReport.create(deletedReport);
      expect(deleted.id).toBeDefined();
      const endARCount = await ActivityReport.count();
      expect(endARCount).toEqual(beginningARCount);
    });
  });

  describe('stateCode', () => {
    let reportOne;
    let reportTwo;
    let reportThree;
    let possibleIds;

    beforeAll(async () => {
      const grantOne = await createGrant({
        stateCode: 'KS',
      });

      const grantTwo = await createGrant({
        stateCode: 'MO',
      });

      reportOne = await createReport({
        id: 2423423,
        activityRecipients: [
          {
            grantId: grantOne.id,
          },
        ],
      });
      reportTwo = await createReport({
        id: 2423424,
        activityRecipients: [
          {
            grantId: grantOne.id,
          },
          {
            grantId: grantTwo.id,
          },
        ],
      });
      reportThree = await createReport({
        id: 2423425,
        activityRecipients: [
          {
            grantId: grantTwo.id,
          },
        ],
      });

      possibleIds = [
        reportOne.id,
        reportTwo.id,
        reportThree.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await destroyReport(reportOne);
      await destroyReport(reportTwo);
      await destroyReport(reportThree);
    });

    it('includes reports with grants with the given state code', async () => {
      const filters = { 'stateCode.ctn': ['KS'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportOne.id, reportTwo.id]));
    });
  });

  describe('createDate', () => {
    let firstReport;
    let secondReport;
    let thirdReport;
    let fourthReport;
    let possibleIds;

    beforeAll(async () => {
      firstReport = await ActivityReport.create({ ...draftReport, id: 95842, createdAt: '2019-01-01T21:00:57.149Z' });
      secondReport = await ActivityReport.create({ ...draftReport, id: 95843, createdAt: '2020-02-01T21:11:57.149Z' });
      thirdReport = await ActivityReport.create({ ...draftReport, id: 95844, createdAt: '2021-01-01T21:14:57.149Z' });
      fourthReport = await ActivityReport.create({ ...draftReport, id: 95845, createdAt: '2023-01-01T21:15:57.149Z' });
      possibleIds = [
        firstReport.id,
        secondReport.id,
        thirdReport.id,
        fourthReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [firstReport.id, secondReport.id, thirdReport.id, fourthReport.id] },
      });
    });

    it('before returns reports with create dates before the given date', async () => {
      const filters = { 'createDate.bef': '2020/12/31' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([firstReport.id, secondReport.id]));
    });

    it('after returns reports with create dates after the given date', async () => {
      const filters = { 'createDate.aft': '2021/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([fourthReport.id]));
    });

    it('within returns reports with create dates between the two dates', async () => {
      const filters = { 'createDate.win': '2020/01/01-2021/06/06' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([secondReport.id, thirdReport.id]));
    });
  });

  describe('endDate', () => {
    let firstReport;
    let secondReport;
    let thirdReport;
    let fourthReport;
    let possibleIds;

    beforeAll(async () => {
      firstReport = await ActivityReport.create(
        { ...draftReport, id: 95842, endDate: new Date(2020, 8, 1) },
      );
      secondReport = await ActivityReport.create(
        { ...draftReport, id: 95843, endDate: new Date(2020, 8, 2) },
      );
      thirdReport = await ActivityReport.create(
        { ...draftReport, id: 95844, endDate: new Date(2020, 8, 3) },
      );
      fourthReport = await ActivityReport.create(
        { ...draftReport, id: 95845, endDate: new Date(2020, 8, 4) },
      );
      possibleIds = [
        firstReport.id,
        secondReport.id,
        thirdReport.id,
        fourthReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [firstReport.id, secondReport.id, thirdReport.id, fourthReport.id] },
      });
    });

    it('before returns reports with end dates before the given date', async () => {
      const filters = { 'endDate.bef': '2020/09/02' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([firstReport.id, secondReport.id]));
    });

    it('after returns reports with end dates after the given date', async () => {
      const filters = { 'endDate.aft': '2020/09/04' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(1);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([fourthReport.id]));
    });

    it('within returns reports with create dates between the two dates', async () => {
      const filters = { 'endDate.win': '2020/09/01-2020/09/03' };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(3);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([firstReport.id, secondReport.id, thirdReport.id]));
    });
  });

  describe('region id', () => {
    let includedReport1;
    let includedReport2;
    let excludedReport;
    let possibleIds;

    beforeAll(async () => {
      includedReport1 = await ActivityReport.create({ ...draftReport, regionId: 2 });
      includedReport2 = await ActivityReport.create({ ...draftReport, regionId: 2 });
      excludedReport = await ActivityReport.create({ ...draftReport, regionId: 3 });
      possibleIds = [
        includedReport1.id,
        includedReport2.id,
        excludedReport.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityReport.destroy({
        where: { id: [includedReport1.id, includedReport2.id, excludedReport.id] },
      });
    });

    it('includes region id', async () => {
      const filters = { 'region.in': ['2'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([includedReport1.id, includedReport2.id]));
    });

    it('excludes region id', async () => {
      const filters = { 'region.nin': ['2'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([excludedReport.id, globallyExcludedReport.id]));
    });
  });

  describe('only other entities', () => {
    let reportIncluded1;
    let reportExcluded;
    let reportIncluded2;

    let otherEntityIncluded1;
    let otherEntityIncluded2;
    let otherEntityExcluded;

    let possibleIds;

    beforeAll(async () => {
      otherEntityIncluded1 = await OtherEntity.create({ id: 25458, name: 'Head Start Collaboration Office' });
      otherEntityExcluded = await OtherEntity.create({ id: 25459, name: 'QRIS System' });
      otherEntityIncluded2 = await OtherEntity.create({ id: 25460, name: 'State CCR&R' });

      reportIncluded1 = await ActivityReport.create(
        { userId: mockUser.id, ...draftReport },
      );
      reportIncluded2 = await ActivityReport.create(
        { userId: mockUser.id, ...draftReport },
      );
      reportExcluded = await ActivityReport.create(
        { userId: mockUser.id, ...draftReport },
      );

      await ActivityRecipient.create({
        activityReportId: reportIncluded1.id,
        otherEntityId: otherEntityIncluded1.id,
      });
      await ActivityRecipient.create({
        activityReportId: reportExcluded.id,
        otherEntityId: otherEntityExcluded.id,
      });
      await ActivityRecipient.create({
        activityReportId: reportIncluded2.id,
        otherEntityId: otherEntityIncluded2.id,
      });

      possibleIds = [
        reportIncluded1.id,
        reportIncluded2.id,
        reportExcluded.id,
        globallyExcludedReport.id,
      ];
    });

    afterAll(async () => {
      await ActivityRecipient.destroy({
        where: {
          activityReportId: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id],
        },
      });
      await ActivityReport.destroy({
        where: { id: [reportIncluded1.id, reportIncluded2.id, reportExcluded.id] },
      });
      await OtherEntity.destroy({
        where: { id: [otherEntityIncluded1.id, otherEntityIncluded2.id, otherEntityExcluded.id] },
      });
    });

    it('includes other entities', async () => {
      const filters = { 'otherEntities.in': ['Head Start Collaboration Office', 'State CCR&R'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportIncluded1.id, reportIncluded2.id]));
    });

    it('excludes other entities', async () => {
      const filters = { 'otherEntities.nin': ['Head Start Collaboration Office', 'State CCR&R'] };
      const { activityReport: scope } = filtersToScopes(filters);
      const found = await ActivityReport.findAll({
        where: { [Op.and]: [scope, { id: possibleIds }] },
      });
      expect(found.length).toBe(2);
      expect(found.map((f) => f.id))
        .toEqual(expect.arrayContaining([reportExcluded.id, globallyExcludedReport.id]));
    });
  });
});
