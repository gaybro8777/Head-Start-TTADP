import ActivityReport from './activityReport';
import SCOPES from '../middleware/scopeConstants';
import { REPORT_STATUSES } from '../constants';

function activityReport(
  author,
  activityReportCollaborator,
  approvers,
  submissionStatus = REPORT_STATUSES.DRAFT,
  calculatedStatus = null,
) {
  const report = {
    userId: author,
    regionId: 1,
    activityReportCollaborators: [],
    approvers: [],
    submissionStatus,
    calculatedStatus,
  };

  if (activityReportCollaborator) {
    report.activityReportCollaborators.push(activityReportCollaborator);
  }

  if (approvers) {
    report.approvers = [...report.approvers, ...approvers.map((approver) => ({
      id: 9, status: null, note: null, User: { id: approver },
    })),
    ];
  }

  return report;
}

function user(write, read, admin, approve, id = 1) {
  const u = { id, permissions: [] };
  if (write) {
    u.permissions.push({
      scopeId: SCOPES.READ_WRITE_REPORTS,
      regionId: 1,
    });
  }

  if (read) {
    u.permissions.push({
      scopeId: SCOPES.READ_REPORTS,
      regionId: 1,
    });
  }

  if (admin) {
    u.permissions.push({
      scopeId: SCOPES.ADMIN,
      regionId: null,
    });
  }

  if (approve) {
    u.permissions.push({
      scopeId: SCOPES.APPROVE_REPORTS,
      regionId: 1,
    });
  }

  return u;
}

const author = user(true, false, false, false, 1);
const activityReportCollaborator = { user: user(true, false, false, false, 2) };
const manager = user(true, false, false, false, 3);
const otherUser = user(false, true, false, false, 4);
const canNotReadRegion = user(false, false, false, false, 5);
const admin = user(true, true, true, false, 6);
const approver = user(false, false, false, true, 7);
const canApproveRegion = user(false, false, false, true, 8);
const canNotApproveRegion = user(false, false, false, false, 9);

describe('Activity Report policies', () => {
  describe('canReview', () => {
    it('is true if the user is the approving manager', () => {
      const report = activityReport(author.id, null, [approver.id]);
      const policy = new ActivityReport(approver, report);
      expect(policy.canReview()).toBeTruthy();
    });

    it('is false if the user is not an approving manager even if regional approval', () => {
      const report = activityReport(author.id, null, [approver.id]);
      const policy = new ActivityReport(canApproveRegion, report);
      expect(policy.canReview()).toBeFalsy();
    });

    it('is false if the user does not have regional approval', () => {
      const report = activityReport(author.id, null, [canNotApproveRegion.id]);
      const policy = new ActivityReport(canNotApproveRegion, report);
      expect(policy.canReview()).toBeFalsy();
    });
  });

  describe('canCreate', () => {
    it('is true if the user has write permissions in the region', () => {
      const report = activityReport(author.id);
      const policy = new ActivityReport(author, report);
      expect(policy.canCreate()).toBeTruthy();
    });

    it('is false if the user does not have write permissions in the region', () => {
      const report = activityReport(otherUser.id);
      const policy = new ActivityReport(otherUser, report);
      expect(policy.canCreate()).toBeFalsy();
    });
  });

  describe('canUpdate', () => {
    describe('if the user has write permissions in the region', () => {
      it('is true if the user is the author', () => {
        const report = activityReport(author.id);
        const policy = new ActivityReport(author, report);
        expect(policy.canUpdate()).toBeTruthy();
      });

      it('is true if the user is the author and report calculatedStatus is NEEDS_ACTION', () => {
        const report = activityReport(
          author.id,
          null,
          null,
          REPORT_STATUSES.SUBMITTED,
          REPORT_STATUSES.NEEDS_ACTION,
        );
        const policy = new ActivityReport(author, report);
        expect(policy.canUpdate()).toBeTruthy();
      });

      it('is true if the user is a collaborator', () => {
        const report = activityReport(author.id, activityReportCollaborator);
        const policy = new ActivityReport(activityReportCollaborator.user, report);
        expect(policy.canUpdate()).toBeTruthy();
      });

      it('is true if the user is an approver', () => {
        const report = activityReport(
          author.id,
          null,
          [approver.id],
          REPORT_STATUSES.SUBMITTED,
          REPORT_STATUSES.SUBMITTED,
        );
        const policy = new ActivityReport(approver, report);
        expect(policy.canUpdate()).toBeTruthy();
      });

      it('...unless the report is draft', () => {
        const report = activityReport(
          author.id,
          null,
          [approver.id],
          REPORT_STATUSES.DRAFT,
          REPORT_STATUSES.DRAFT,
        );
        const policy = new ActivityReport(approver, report);
        expect(policy.canUpdate()).toBe(false);
      });

      it('...unless the report is approved', () => {
        const report = activityReport(
          author.id,
          null,
          [approver.id],
          REPORT_STATUSES.APPROVED,
          REPORT_STATUSES.APPROVED,
        );
        const policy = new ActivityReport(approver, report);
        expect(policy.canUpdate()).toBe(false);
      });

      it('...unless the report has already been approved by another', () => {
        const report = activityReport(
          author.id,
          null,
          [approver.id, canApproveRegion.id],
          REPORT_STATUSES.APPROVED,
          REPORT_STATUSES.APPROVED,
        );

        report.approvers[1] = {
          ...report.approvers[1],
          status: REPORT_STATUSES.APPROVED,
        };

        const policy = new ActivityReport(approver, report);
        expect(policy.canUpdate()).toBe(false);
      });

      it('is false for non-authors/collaborators/approvers', () => {
        const report = activityReport(author.id);
        const policy = new ActivityReport(otherUser, report);
        expect(policy.canUpdate()).toBeFalsy();
      });
    });

    it('is false if the user cannot write in the region', () => {
      const report = activityReport(otherUser.id);
      const policy = new ActivityReport(otherUser, report);
      expect(policy.canUpdate()).toBeFalsy();
    });

    it('is false if the report has been submitted', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.SUBMITTED,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canUpdate()).toBeFalsy();
    });

    it('is false if the report has been approved', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.APPROVED,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canUpdate()).toBeFalsy();
    });
  });

  describe('canReset', () => {
    it('is false for reports that have been approved', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.APPROVED,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canReset()).toBeFalsy();
    });

    it('is true for the author', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.SUBMITTED,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canReset()).toBeTruthy();
    });

    it('is true for collaborators', () => {
      const report = activityReport(
        author.id,
        activityReportCollaborator,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.SUBMITTED,
      );
      const policy = new ActivityReport(activityReportCollaborator.user, report);
      expect(policy.canReset()).toBeTruthy();
    });

    it('is false for other users', () => {
      const report = activityReport(
        author.id,
        activityReportCollaborator,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.SUBMITTED,
      );
      const policy = new ActivityReport(otherUser, report);
      expect(policy.canReset()).toBeFalsy();
    });
  });

  describe('canViewLegacy', () => {
    it('is true if the user can view the region', () => {
      const report = activityReport(author.id);
      const policy = new ActivityReport(author, report);
      expect(policy.canViewLegacy()).toBeTruthy();
    });

    it('is true if the user can approver reports in the region', () => {
      const report = activityReport(author.id);
      const policy = new ActivityReport(approver, report);
      expect(policy.canViewLegacy()).toBeTruthy();
    });

    it('is false if the user can not view the region', () => {
      const report = activityReport(author.id);
      const policy = new ActivityReport(canNotReadRegion, report);
      expect(policy.canViewLegacy()).toBeFalsy();
    });
  });

  describe('canGet', () => {
    describe('for unapproved reports', () => {
      it('is true for the author', () => {
        const report = activityReport(author.id);
        const policy = new ActivityReport(author, report);
        expect(policy.canGet()).toBeTruthy();
      });

      it('is true for the collaborator', () => {
        const report = activityReport(author.id, activityReportCollaborator);
        const policy = new ActivityReport(activityReportCollaborator.user, report);
        expect(policy.canGet()).toBeTruthy();
      });

      it('is true for the approving manager', () => {
        const report = activityReport(author.id, null, [manager.id]);
        const policy = new ActivityReport(manager, report);
        expect(policy.canGet()).toBeTruthy();
      });

      it('is false for any user not associated with the report', () => {
        const report = activityReport(author.id);
        const policy = new ActivityReport(otherUser, report);
        expect(policy.canGet()).toBeFalsy();
      });
    });

    describe('for approved reports', () => {
      it('is true for users with read permissions in the region', () => {
        const report = activityReport(
          author.id,
          null,
          null,
          REPORT_STATUSES.SUBMITTED,
          REPORT_STATUSES.APPROVED,
        );
        const policy = new ActivityReport(otherUser, report);
        expect(policy.canGet()).toBeTruthy();
      });

      it('is true for users with approve permissions in the region', () => {
        const report = activityReport(
          author.id,
          null,
          null,
          REPORT_STATUSES.SUBMITTED,
          REPORT_STATUSES.APPROVED,
        );
        const policy = new ActivityReport(approver, report);
        expect(policy.canGet()).toBeTruthy();
      });
    });
  });

  describe('canDelete', () => {
    it('is true for author of draft report', () => {
      const report = activityReport(author.id);
      const policy = new ActivityReport(author, report);
      expect(policy.canDelete()).toBeTruthy();
    });

    it('is true for author of submitted report', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.SUBMITTED,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canDelete()).toBeTruthy();
    });

    it('is true for author of a report the needs action', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.NEEDS_ACTION,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canDelete()).toBeTruthy();
    });

    it('is true for admin user of draft report', () => {
      const report = activityReport(author.id);
      const policy = new ActivityReport(admin, report);
      expect(policy.canDelete()).toBeTruthy();
    });

    it('is false for any non-admin/non-author user of draft report', () => {
      const report = activityReport(author.id, activityReportCollaborator);
      const policy = new ActivityReport(activityReportCollaborator.user, report);
      expect(policy.canDelete()).toBeFalsy();
    });

    it('is false for author of an approved report', () => {
      const report = activityReport(
        author.id,
        null,
        null,
        REPORT_STATUSES.SUBMITTED,
        REPORT_STATUSES.APPROVED,
      );
      const policy = new ActivityReport(author, report);
      expect(policy.canDelete()).toBeFalsy();
    });
  });
});
