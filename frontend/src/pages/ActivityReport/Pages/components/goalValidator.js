import {
  validateListOfResources,
  GOAL_NAME_ERROR,
  GOAL_RTTAPA_ERROR,
} from '../../../../components/GoalForm/constants';

export const UNFINISHED_OBJECTIVES = 'All objective fields must be completed';
export const GOAL_MISSING_OBJECTIVE = 'Select a TTA objective';
export const GOALS_EMPTY = 'Select a recipent\'s goal';
export const OBJECTIVE_TITLE = 'Enter an objective';
export const OBJECTIVE_ROLE = 'Select a specialist role';
export const OBJECTIVE_RESOURCES = 'Each resource should be a valid link. Invalid resources will not be saved.';
export const OBJECTIVE_TTA = 'Describe the TTA provided';
export const OBJECTIVE_TOPICS = 'Select at least one topic';

export const unfinishedObjectives = (objectives, setError = () => {}, fieldArrayName = 'goalForEditing.objectives') => {
  const unfinished = objectives.some(
    (objective, index) => {
      let incomplete = false;
      if (!objective.title) {
        // debugger;
        setError(`${fieldArrayName}[${index}].title`, { message: OBJECTIVE_TITLE });
        incomplete = true;
      }

      if (!objective.ttaProvided || objective.ttaProvided === '<p></p>' || objective.ttaProvided === '<p></p>\n') {
        // debugger;
        setError(`${fieldArrayName}[${index}].ttaProvided`, { message: OBJECTIVE_TTA });
        incomplete = true;
      }

      if (!objective.topics || !objective.topics.length) {
        // debugger;
        setError(`${fieldArrayName}[${index}].topics`, { message: OBJECTIVE_TOPICS });
        incomplete = true;
      }

      if (!objective.resources || !validateListOfResources(objective.resources)) {
        // debugger;
        setError(`${fieldArrayName}[${index}].resources`, { message: OBJECTIVE_RESOURCES });
        incomplete = true;
      }

      return incomplete;
    },
  );

  return unfinished ? UNFINISHED_OBJECTIVES : false;
};

export const unfinishedGoals = (goals, setError = () => {}) => {
  for (let i = 0; i < goals.length; i += 1) {
    const goal = goals[i];

    if (!goal.name) {
      setError('goalName', { message: GOAL_NAME_ERROR });
      // debugger;
      return GOAL_NAME_ERROR;
    }

    if (goal.isRttapa !== 'Yes' && goal.isRttapa !== 'No') {
      // debugger;
      setError('goalIsRttapa', { message: GOAL_RTTAPA_ERROR });
      return GOAL_RTTAPA_ERROR;
    }

    // Every goal must have an objective or the `goals` field has unfinished goals
    if (goal.objectives && goal.objectives.length > 0) {
      const objectivesUnfinished = unfinishedObjectives(goal.objectives, setError);
      if (objectivesUnfinished) {
        return objectivesUnfinished;
      }
    } else {
      setError('goalForEditing.objectives', { message: GOAL_MISSING_OBJECTIVE });

      return GOAL_MISSING_OBJECTIVE;
    }
  }
  return false;
};

export const validateGoals = (goals, setError = () => {}) => {
  if (goals.length < 1) {
    // debugger;
    return GOALS_EMPTY;
  }

  const unfinishedMessage = unfinishedGoals(goals, setError);
  if (unfinishedMessage) {
    // debugger;
    return unfinishedMessage;
  }
  return true;
};
