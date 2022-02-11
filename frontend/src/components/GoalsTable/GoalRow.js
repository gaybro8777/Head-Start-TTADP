/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCheckCircle,
  faExclamationCircle,
  faPencilAlt,
  faMinusCircle,
  faTimesCircle,
  faFlag,
  faAngleUp,
  faAngleDown,
} from '@fortawesome/free-solid-svg-icons';
import ContextMenu from '../ContextMenu';
import Tooltip from '../Tooltip';
import { DATE_DISPLAY_FORMAT } from '../../Constants';
import { reasonsToMonitor } from '../../pages/ActivityReport/constants';
import { updateGoalStatus } from '../../fetchers/goals';
import ObjectiveRow from './ObjectiveRow';
import './GoalRow.css';

function GoalRow({
  goal,
  openMenuUp,
  updateGoal,
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
  } = goal;

  const [objectivesExpanded, setObjectivesExpanded] = useState(false);

  const contextMenuLabel = `Actions for goal ${id}`;

  const getGoalStatusIcon = () => {
    if (goalStatus) {
      if (goalStatus === 'In Progress') {
        return <FontAwesomeIcon className="margin-right-1" size="1x" color="#0166ab" icon={faClock} />;
      } if (goalStatus === 'Completed') {
        return <FontAwesomeIcon className="margin-right-1" size="1x" color="#148439" icon={faCheckCircle} />;
      }
      if (goalStatus === 'Draft') {
        return <FontAwesomeIcon className="margin-right-1" size="1x" color="#475260" icon={faPencilAlt} />;
      }
      if (goalStatus === 'Not Started') {
        return <FontAwesomeIcon className="margin-right-1" size="1x" color="#e2a04d" icon={faMinusCircle} />;
      }
      if (goalStatus === 'Ceased/Suspended') {
        return <FontAwesomeIcon className="margin-right-1" size="1x" color="#b50908" icon={faTimesCircle} />;
      }
    }
    return <FontAwesomeIcon className="margin-right-1" size="1x" color="#c5c5c5" icon={faExclamationCircle} />;
  };

  const mapToDisplay = [
    {
      stored: 'In Progress',
      display: 'In progress',
    },
    {
      stored: 'Completed',
      display: 'Closed',
    },
    {
      stored: 'Draft',
      display: 'Draft',
    },
    {
      stored: 'Not Started',
      display: 'Not started',
    },
    {
      stored: 'Ceased/Suspended',
      display: 'Ceased/suspended',
    },
    {
      stored: 'Needs Status',
      display: 'Needs status',
    },
  ];

  const getGoalDisplayStatusText = () => {
    if (goalStatus) {
      const displayStatus = mapToDisplay.find((m) => m.stored === goalStatus);
      return displayStatus ? displayStatus.display : 'Needs status';
    }
    return 'Needs status';
  };

  const displayStatus = getGoalDisplayStatusText();

  let showContextMenu = false;
  const availableMenuItems = [
    {
      status: 'Needs status',
      values: ['Mark not started', 'Mark in progress', 'Close goal', 'Cease/suspend goal'],
    },
    {
      status: 'Not started',
      values: ['Close goal', 'Cease/suspend goal'],
    },
    {
      status: 'In progress',
      values: ['Close goal', 'Cease/suspend goal'],
    },
    {
      status: 'Closed',
      values: ['Re-open goal'],
    },
    {
      status: 'Ceased/suspended',
      values: ['Re-open goal'],
    },
  ];

  const mapToStoredStatus = [
    {
      status: 'Mark not started',
      stored: 'Not Started',
    },
    {
      status: 'Mark in progress',
      stored: 'In Progress',
    },
    {
      status: 'Close goal',
      stored: 'Completed',
    },
    {
      status: 'Cease/suspend goal',
      stored: 'Ceased/Suspended',
    },
    {
      status: 'Re-open goal',
      stored: 'In Progress',
    },
  ];

  const onUpdateGoalStatus = async (status) => {
    const goalToSave = mapToStoredStatus.find((m) => m.status === status);
    if (goalToSave) {
      const updatedGoal = await updateGoalStatus(id, goalToSave.stored);
      updateGoal(updatedGoal);
    }
  };

  const determineAvailableMenuItems = () => {
    const menuItemsToDisplay = availableMenuItems.find((m) => m.status === displayStatus);

    let menuItemsToReturn = [];
    if (menuItemsToDisplay) {
      showContextMenu = true;
      menuItemsToReturn = menuItemsToDisplay.values.map((v) => (
        {
          label: v,
          onClick: () => { onUpdateGoalStatus(v); },
        }
      ));
    }
    return menuItemsToReturn;
  };

  const menuItems = determineAvailableMenuItems();

  const determineFlagStatus = () => {
    const reasonsToWatch = reasons.find((t) => reasonsToMonitor.includes(t));
    if (reasonsToWatch) {
      return (
        <>
          <Tooltip
            displayText={<FontAwesomeIcon className="margin-left-1" size="1x" color="#d42240" icon={faFlag} />}
            screenReadDisplayText={false}
            buttonLabel={`Click to reveal reason for flag ${goalNumber}`}
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

  const expandObjectives = () => {
    setObjectivesExpanded(!objectivesExpanded);
  };

  return (
    <>
      <tr className={`tta-smarthub--goal-row ${!objectivesExpanded ? 'tta-smarthub--goal-row-collapsed' : ''}`} key={`goal_row_${id}`}>
        <td>
          {getGoalStatusIcon()}
          {displayStatus === 'Ceased/suspended' ? ['Ceased/ ', <br />, 'suspended'] : displayStatus}
        </td>
        <td>{moment(createdOn).format(DATE_DISPLAY_FORMAT)}</td>
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
                buttonLabel={`Click to reveal topics for goal ${goalNumber}`}
                tooltipText={goalTopics.join(', ')}
                hideUnderline={false}
                svgLineTo={300}
              />
            )
            : displayGoalTopics}
        </td>
        <td>
          <a
            className={`text-middle tta-smarthub--goal-row-objectives-${objectiveCount > 0 ? 'enabled' : 'disabled'}`}
            role="button"
            onClick={() => expandObjectives()}
            aria-label="Expand objective's for this goal."
            tabIndex={0}
            onKeyPress={() => expandObjectives()}
          >
            <strong className="margin-left-1">{objectiveCount}</strong>
            {' '}
            Objective(s)
            {
              objectiveCount > 0
                ? (
                  <FontAwesomeIcon className="margin-left-1 margin-right-1" size="1x" color="#000000" icon={objectivesExpanded ? faAngleDown : faAngleUp} />
                )
                : null
            }
          </a>
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
        <td colSpan="6">
          <table>
            <thead>
              <tr>
                <th scope="col">Objective</th>
                <th scope="col">Activity report</th>
                <th scope="col">End date</th>
                <th scope="col">Reasons</th>
                <th scope="col">Objectives status</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map((obj) => (
                <ObjectiveRow
                  objective={obj}
                />
              ))}
            </tbody>
          </table>
        </td>
      </tr>
      <tr className="height-1" aria-hidden />
    </>
  );
}

export const objectivePropTypes = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  arNumber: PropTypes.string.isRequired,
  ttaProvided: PropTypes.string.isRequired,
  endDate: PropTypes.arrayOf(PropTypes.string).isRequired,
  reasons: PropTypes.arrayOf(PropTypes.string).isRequired,
  status: PropTypes.number.isRequired,
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
  objectives: PropTypes.arrayOf(objectivePropTypes).isRequired,
});

goalPropTypes.defaultProps = {
  goalStatus: null,
};
GoalRow.propTypes = {
  goal: goalPropTypes.isRequired,
  openMenuUp: PropTypes.bool.isRequired,
  updateGoal: PropTypes.func.isRequired,
};
export default GoalRow;
