import React from 'react';
import moment from 'moment-timezone';
import Container from '../../../components/Container';
import ApprovedReportSection from './ApprovedReportSection';
import {
  DATE_DISPLAY_FORMAT,
  DATEPICKER_VALUE_FORMAT,
} from '../../../Constants';
import { reportDataPropTypes, formatSimpleArray } from '../helpers';

function formatNextSteps(nextSteps, heading) {
  const data = nextSteps.reduce((acc, step, index) => ({
    ...acc,
    [`Step ${index + 1}`]: step.note,
    'Anticipated completion': step.completeDate,
  }), {});
  return {
    heading,
    data,
  };
}

/**
   *
   * @param {object} report an activity report object
   * @returns an array of two arrays, each of which contains strings
   */
function calculateGoalsAndObjectives(report) {
  const sections = [];
  if (report.activityRecipientType === 'recipient') {
    report.goalsAndObjectives.forEach((goal) => {
      const goalSection = {
        heading: 'Goal summary',
        data: {
          'Recipient\'s goal': goal.name,
        },
      };

      sections.push(goalSection);

      goal.objectives.forEach((objective) => {
        const objectiveSection = {
          heading: 'Objective summary',
          data: {
            'TTA objective': objective.title,
            // Topics: formatSimpleArray(objective.topics.map()),

          },
        };

        sections.push(objectiveSection);
      });
    });
  } else if (report.activityRecipientType === 'other-entity') {
    report.objectivesWithoutGoals.forEach(() => {});
  }

  return sections;
}

function formatRequester(requester) {
  if (requester === 'recipient') {
    return 'Recipient';
  }

  if (requester === 'regionalOffice') {
    return 'Regional Office';
  }

  return '';
}

function mapAttachments(attachments) {
  if (Array.isArray(attachments) && attachments.length > 0) {
    return (
      <ul>
        {
            attachments.map((attachment) => (
              <li key={attachment.url.url}>
                <a
                  href={attachment.url.url}
                  target={attachment.originalFileName.endsWith('.txt') ? '_blank' : '_self'}
                  rel="noreferrer"
                >
                  {
                    `${attachment.originalFileName}
                     ${attachment.originalFileName.endsWith('.txt')
                      ? ' (opens in new tab)'
                      : ''}`
                  }
                </a>
              </li>
            ))
          }
      </ul>
    );
  }

  return [];
}

export default function ApprovedReportV2({ data }) {
  const {
    reportId, ttaType, deliveryMethod, creatorNotes,
  } = data;

  // first table
  const isRecipient = data.activityRecipientType === 'recipient';
  let recipientType = isRecipient ? 'Recipient' : 'Other entity';
  if (data.activityRecipients.length > 1) {
    recipientType = isRecipient ? 'Recipients' : 'Other entities';
  }

  const arRecipients = data.activityRecipients.map((arRecipient) => arRecipient.name).sort().join(', ');
  const targetPopulations = data.targetPopulations.map((population) => population).join(', '); // Approvers.
  const approvingManagers = data.approvers.map((a) => a.User.fullName).join(', ');
  const collaborators = data.activityReportCollaborators.map(
    (a) => a.fullName,
  );

  // Approver Notes.
  const managerNotes = data.approvers.map((a) => `
          <h2>${a.User.fullName}:</h2>
          ${a.note ? a.note : '<p>No manager notes</p>'}`).join('');

  const attendees = formatSimpleArray(data.participants);
  const participantCount = data.numberOfParticipants.toString();
  const reasons = formatSimpleArray(data.reason);
  const startDate = moment(data.startDate, DATEPICKER_VALUE_FORMAT).format('MMMM D, YYYY');
  const endDate = moment(data.endDate, DATEPICKER_VALUE_FORMAT).format('MMMM D, YYYY');
  const duration = `${data.duration} hours`;
  const requester = formatRequester(data.requester);

  const goalSections = calculateGoalsAndObjectives(data);

  // second table
  const attachments = mapAttachments(data.files);

  // third table
  const {
    context, displayId,
  } = data;

  // next steps table
  const specialistNextSteps = formatNextSteps(data.specialistNextSteps);
  const recipientNextSteps = formatNextSteps(data.recipientNextSteps);
  const approvedAt = data.approvedAt ? moment(data.approvedAt).format(DATE_DISPLAY_FORMAT) : '';
  const createdAt = moment(data.createdAt).format(DATE_DISPLAY_FORMAT);

  const creator = data.author.fullName || '';

  return (
    <Container className="ttahub-activity-report-view margin-top-2">
      <h1 className="landing">
        TTA activity report
        {' '}
        {displayId}
      </h1>
      <div className="ttahub-activity-report-view-creator-data margin-bottom-4">
        <p>
          <strong>Creator:</strong>
          {' '}
          {creator}
        </p>
        <p className="no-print">
          <strong>Date created:</strong>
          {' '}
          {createdAt}
        </p>
        <p>
          <strong>Collaborators:</strong>
          {' '}
          {collaborators.map((collaborator) => collaborator).join(', ')}
        </p>
        <p>
          <strong>Managers:</strong>
          {' '}
          {approvingManagers}
        </p>
        <p>
          <strong>Date approved:</strong>
          {' '}
          {approvedAt}
        </p>
      </div>

      <ApprovedReportSection
        key={`activity-summary-${reportId}`}
        title="Activity Summary"
        sections={[
          {
            heading: 'Who was the activity for?',
            data: {
              'Recipient or other entity': recipientType,
              'Recipient names': arRecipients,
              'Target populations': targetPopulations,
            },
          },
          {
            heading: 'Reason for activity',
            data: {
              'Who requested the activity': requester,
              Reasons: reasons,
            },
          },
          {
            heading: 'Activity date',
            data: {
              'Start date': startDate,
              'End date': endDate,
              Duration: duration,
            },
          },
          {
            heading: 'Context',
            data: {
              Context: context,
            },
          },
          {
            heading: 'Training or technical assistance',
            data: {
              'TTA provided': ttaType,
              'TTA conducted': deliveryMethod,
            },
          },
          {
            heading: 'Participants',
            data: {
              Participants: attendees,
              'Number of participants': participantCount,
            },
          },
        ]}
      />

      <ApprovedReportSection
        key={`goals-and-objectives-${reportId}`}
        title="Goals and objectives"
        sections={goalSections}
      />

      <ApprovedReportSection
        key={`supporting-attachments${reportId}`}
        title="Supporting attachments"
        sections={
            [{
              heading: '',
              data: {
                Attachments: attachments,
              },
            }]
          }
      />

      <ApprovedReportSection
        key={`next-steps${reportId}`}
        title="Next steps"
        sections={[
          specialistNextSteps,
          recipientNextSteps,
        ]}
      />

      <ApprovedReportSection
        key={`review-and-submit-${reportId}`}
        className="no-print"
        title="Review and submit"
        sections={[
          {
            data: {
              'Creator notes': creatorNotes,
              'Manager notes': managerNotes,
            },
          },
        ]}
      />

    </Container>
  );
}

ApprovedReportV2.propTypes = reportDataPropTypes;
