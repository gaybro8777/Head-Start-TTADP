import React from 'react';
import PropTypes from 'prop-types';
import PrintableObjective from './PrintableObjective';
import { ROW_CLASS, FIRST_COLUMN_CLASS, SECOND_COLUMN_CLASS } from './constants';
import { STATUSES } from '../../../../components/GoalsTable/StatusDropdown';
import List from './List';

export default function PrintableGoal({ goal }) {
  const key = goal.goalStatus || 'Needs Status';
  const { icon } = STATUSES[key];

  return (
    <div className="ttahub-printable-goal padding-x-3 padding-top-3 padding-bottom-2 margin-top-5">
      <h2 className="margin-top-0 padding-bottom-1 border-bottom-1px">
        Goal
        {' '}
        {goal.goalNumber}
      </h2>
      <div className={ROW_CLASS}>
        <p className={FIRST_COLUMN_CLASS}>Goal status</p>
        <p className={SECOND_COLUMN_CLASS}>
          {icon}
          {goal.goalStatus}
        </p>
      </div>
      <div className={ROW_CLASS}>
        <p className={FIRST_COLUMN_CLASS}>Grant numbers</p>
        <p className={SECOND_COLUMN_CLASS}>{goal.grantNumber}</p>
      </div>
      <div className={ROW_CLASS}>
        <p className={FIRST_COLUMN_CLASS}>Recipient&apos;s goal</p>
        <p className={SECOND_COLUMN_CLASS}>{goal.goalText}</p>
      </div>
      <div className={ROW_CLASS}>
        <p className={FIRST_COLUMN_CLASS}>Topics</p>
        <List className={SECOND_COLUMN_CLASS} list={goal.goalTopics} />
      </div>
      {goal.objectives.map(((objective) => (
        <PrintableObjective
          key={objective.id}
          objective={objective}
        />
      )))}
    </div>
  );
}

PrintableGoal.propTypes = {
  goal: PropTypes.shape({
    goalNumber: PropTypes.string,
    goalStatus: PropTypes.string,
    grantNumber: PropTypes.string,
    goalText: PropTypes.string,
    goalTopics: PropTypes.arrayOf(PropTypes.string),
    objectives: PropTypes.arrayOf(PropTypes.shape({})),
  }).isRequired,
};