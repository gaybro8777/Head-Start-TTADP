/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFlag,
  faAngleUp,
  faAngleDown,
} from '@fortawesome/free-solid-svg-icons';
import StatusDropdown from './StatusDropdown';
import ContextMenu from '../ContextMenu';
import Tooltip from '../Tooltip';
import { DATE_DISPLAY_FORMAT } from '../../Constants';
import { reasonsToMonitor } from '../../pages/ActivityReport/constants';
import ObjectiveRow from './ObjectiveRow';
import './GoalRow.scss';
import colors from '../../colors';

function ObjectiveButton({
  closeOrOpenObjectives,
  objectiveCount,
  objectivesExpanded,
  goalNumber,
  expandObjectivesRef,
}) {
  if (objectiveCount < 1) {
    return (
      <span className="text-no-underline text-ink text-middle tta-smarthub--goal-row-objectives tta-smarthub--goal-row-objectives-disabled">
        <strong className="margin-left-1">{objectiveCount}</strong>
        {' '}
        Objectives
      </span>
    );
  }

  return (
    <button
      type="button"
      ref={expandObjectivesRef}
      className="usa-button--unstyled text-no-underline text-ink text-middle tta-smarthub--goal-row-objectives tta-smarthub--goal-row-objectives-enabled"
      onClick={() => closeOrOpenObjectives(false)}
      aria-label={`${objectivesExpanded ? 'Collapse' : 'Expand'} objective's for goal ${goalNumber}`}
    >
      <strong className="margin-left-1">{objectiveCount}</strong>
      {' '}
      Objective
      {objectiveCount > 1 ? 's' : ''}
      <FontAwesomeIcon className="margin-left-1" size="1x" color={colors.textInk} icon={objectivesExpanded ? faAngleUp : faAngleDown} />
    </button>
  );
}

ObjectiveButton.propTypes = {
  closeOrOpenObjectives: PropTypes.func.isRequired,
  objectiveCount: PropTypes.number.isRequired,
  objectivesExpanded: PropTypes.bool.isRequired,
  goalNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  expandObjectivesRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
};

function GoalRow({
  goal,
  openMenuUp,
  recipientId,
  regionId,
  showCloseSuspendGoalModal,
  performGoalStatusUpdate,
}) {
  const {
    id,
    goalStatus,
    createdOn,
    goalText,
    goalTopics,
    objectiveCount,
    goalNumber,
    reasons,
    objectives,
    previousStatus,
  } = goal;

  const history = useHistory();

  const onUpdateGoalStatus = (newStatus) => {
    if (newStatus === 'Completed' || newStatus === 'Closed' || newStatus === 'Ceased/Suspended') {
      // Must provide reason for Close or Suspend.
      showCloseSuspendGoalModal(newStatus, id);
    } else {
      performGoalStatusUpdate(id, newStatus, goalStatus);
    }
  };

  const expandObjectivesRef = useRef();

  const [objectivesExpanded, setObjectivesExpanded] = useState(false);

  const mapToDisplay = [
    {
      stored: 'In Progress',
      display: 'In progress',
      color: '#0166ab',
    },
    {
      stored: 'Completed',
      display: 'Closed',
      color: '#148439',
    },
    {
      stored: 'Draft',
      display: 'Draft',
      color: '#475260',
    },
    {
      stored: 'Not Started',
      display: 'Not started',
      color: '#e2a04d',
    },
    {
      stored: 'Ceased/Suspended',
      display: 'Suspended',
      color: '#b50908',
    },
    {
      stored: 'Needs Status',
      display: 'Needs status',
      color: '#c5c5c5',
    },
  ];

  const determineFlagStatus = () => {
    const reasonsToWatch = reasons.find((t) => reasonsToMonitor.includes(t));
    if (reasonsToWatch) {
      return (
        <>
          <Tooltip
            displayText={<FontAwesomeIcon className="margin-left-1" size="1x" color={colors.error} icon={faFlag} />}
            screenReadDisplayText={false}
            buttonLabel={`Reason for flag on goal ${goalNumber} is monitoring. Click button to visually reveal this information.`}
            tooltipText="Related to monitoring"
            hideUnderline
          />
        </>
      );
    }
    return null;
  };

  let showToolTip = false;
  const toolTipChars = 39;
  const truncateGoalTopics = (goalTopicsToTruncate) => {
    let queryToReturn = goalTopicsToTruncate.join(', ');
    if (queryToReturn.length > toolTipChars) {
      queryToReturn = queryToReturn.substring(0, toolTipChars);
      queryToReturn += '...';
      showToolTip = true;
    }
    return queryToReturn;
  };

  const displayGoalTopics = truncateGoalTopics(goalTopics);

  const closeOrOpenObjectives = (collapseFromObjectives) => {
    if (collapseFromObjectives && expandObjectivesRef.current) {
      expandObjectivesRef.current.focus();
    }

    setObjectivesExpanded(!objectivesExpanded);
  };

  const getStatusColor = () => {
    if (goalStatus) {
      const goalStatusDisplay = mapToDisplay.find((m) => m.stored === goalStatus);
      if (goalStatusDisplay) {
        return goalStatusDisplay.color;
      }
    }
    return '#c5c5c5';
  };

  const contextMenuLabel = `Actions for goal ${id}`;
  const showContextMenu = false;
  const menuItems = [
    {
      label: 'Edit',
      onClick: () => {
        history.push(`/recipient-tta-records/${recipientId}/region/${regionId}/goals/${id}`);
      },
    },
  ];

  return (
    <>
      <tr className={`tta-smarthub--goal-row ${!objectivesExpanded ? 'tta-smarthub--goal-row-collapsed' : ''}`} key={`goal_row_${id}`}>
        <td style={objectivesExpanded ? { borderLeft: `4px solid ${getStatusColor()}` } : { borderLeft: `1px solid ${colors.baseLightest}`, paddingLeft: '25px' }}>
          <StatusDropdown
            goalId={id}
            status={goalStatus}
            onUpdateGoalStatus={onUpdateGoalStatus}
            previousStatus={previousStatus}
            regionId={regionId}
            up={openMenuUp}
          />
        </td>
        <td>{moment(createdOn, 'YYYY-MM-DD').format(DATE_DISPLAY_FORMAT)}</td>
        <td className="text-wrap maxw-mobile">
          {goalText}
          {' '}
          (
          {goalNumber}
          )
          {determineFlagStatus()}
        </td>
        <td className="text-wrap maxw-mobile">
          {showToolTip
            ? (
              <Tooltip
                displayText={displayGoalTopics}
                screenReadDisplayText={false}
                buttonLabel={`${goalTopics.join(', ')} click to visually reveal`}
                tooltipText={goalTopics.join(', ')}
                hideUnderline={false}
                svgLineTo={300}
              />
            )
            : displayGoalTopics}
        </td>
        <td className="padding-right-0 text-right">
          <ObjectiveButton
            closeOrOpenObjectives={closeOrOpenObjectives}
            objectiveCount={objectiveCount}
            objectivesExpanded={objectivesExpanded}
            goalNumber={goalNumber}
            expandObjectivesRef={expandObjectivesRef}
          />
        </td>
        <td>
          {showContextMenu
            ? (
              <ContextMenu
                label={contextMenuLabel}
                menuItems={menuItems}
                up={openMenuUp}
              />
            )
            : null}
        </td>
      </tr>
      <tr className="tta-smarthub--objective-rows">
        <td
          className="padding-top-0"
          style={objectivesExpanded ? { borderLeft: `4px solid ${getStatusColor()}` } : { borderLeft: `1px solid ${colors.baseLightest}`, paddingLeft: '25px' }}
          colSpan="6"
        >
          <div className="tta-smarthub--goal-row-obj-table padding-bottom-1">
            <ul aria-hidden className="usa-list usa-list--unstyled tta-smarthub--goal-row-obj-table-header padding-top-0 padding-x-2 padding-bottom-1 display-flex">
              <li className="padding-x-105 padding-y-0 padding-left-0 flex-align-self-end">Objective</li>
              <li className="padding-x-105 padding-y-0 flex-align-self-end">Activity reports</li>
              <li className="padding-x-105 padding-y-0 flex-align-self-end">Grant numbers</li>
              <li className="padding-x-105 padding-y-0 flex-align-self-end">End date</li>
              <li className="padding-x-105 padding-y-0 flex-align-self-end">Reasons</li>
              <li className="padding-x-105 padding-y-0 padding-right-0 flex-align-self-end">Objectives status</li>
            </ul>
            {objectives.map((obj) => (
              <ObjectiveRow
                key={`objective_${obj.id}`}
                objective={obj}
              />
            ))}
          </div>
        </td>
      </tr>
      <tr className="height-1" aria-hidden="true" />
    </>
  );
}

export const objectivePropTypes = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  arNumber: PropTypes.string,
  ttaProvided: PropTypes.string,
  endDate: PropTypes.string,
  reasons: PropTypes.arrayOf(PropTypes.string),
  status: PropTypes.string,
});

export const goalPropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  goalStatus: PropTypes.string,
  createdOn: PropTypes.string.isRequired,
  goalText: PropTypes.string.isRequired,
  goalTopics: PropTypes.arrayOf(PropTypes.string).isRequired,
  reasons: PropTypes.arrayOf(PropTypes.string).isRequired,
  objectiveCount: PropTypes.number.isRequired,
  goalNumber: PropTypes.string.isRequired,
  objectives: PropTypes.arrayOf(objectivePropTypes),
  previousStatus: PropTypes.string,
});

goalPropTypes.defaultProps = {
  goalStatus: null,
  objectives: [],
};
GoalRow.propTypes = {
  goal: goalPropTypes.isRequired,
  recipientId: PropTypes.string.isRequired,
  regionId: PropTypes.string.isRequired,
  openMenuUp: PropTypes.bool.isRequired,
  showCloseSuspendGoalModal: PropTypes.func.isRequired,
  performGoalStatusUpdate: PropTypes.func.isRequired,
};
export default GoalRow;
