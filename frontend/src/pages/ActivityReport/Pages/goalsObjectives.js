/* eslint-disable react/jsx-props-no-spreading */
// disabling prop spreading to use the "register" function from react hook form the same
// way they did in thier examples
/* eslint-disable arrow-body-style */
import React, { useState, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Alert, Fieldset } from '@trussworks/react-uswds';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { useFormContext, useController } from 'react-hook-form/dist/index.ie11';
import GoalPicker, { newGoal } from './components/GoalPicker';
import { getGoals } from '../../../fetchers/activityReports';
import { validateGoals } from './components/goalValidator';
import RecipientReviewSection from './components/RecipientReviewSection';
import OtherEntityReviewSection from './components/OtherEntityReviewSection';
import { validateObjectives } from './components/objectiveValidator';
import ConnectionError from './components/ConnectionError';
import Req from '../../../components/Req';
import ReadOnly from '../../../components/GoalForm/ReadOnly';
import PlusButton from '../../../components/GoalForm/PlusButton';
import OtherEntity from './components/OtherEntity';
import GoalFormContext from '../../../GoalFormContext';

const GoalsObjectives = ({ reportId }) => {
  const {
    watch, setValue, getValues, setError,
  } = useFormContext();

  const { isGoalFormClosed, toggleGoalForm } = useContext(GoalFormContext);

  const recipients = watch('activityRecipients');
  const activityRecipientType = watch('activityRecipientType');

  const isRecipientReport = activityRecipientType === 'recipient';
  const grantIds = isRecipientReport ? recipients.map((r) => {
    if (r.grant) {
      return r.grant.id;
    }

    return r.activityRecipientId;
  }) : [];

  const [fetchError, setFetchError] = useState(false);
  const [availableGoals, updateAvailableGoals] = useState([]);
  const hasGrants = grantIds.length > 0;

  const {
    field: {
      onChange: onUpdateGoals,
      value: selectedGoals,
    },
  } = useController({
    name: 'goals',
    rules: {
      validate: {
        validateGoals,
      },
    },
    defaultValue: [],
  });

  useDeepCompareEffect(() => {
    const fetch = async () => {
      try {
        if (isRecipientReport && hasGrants) {
          const fetchedGoals = await getGoals(grantIds);
          const formattedGoals = fetchedGoals.map((g) => ({ ...g, grantIds }));
          updateAvailableGoals(formattedGoals);
        }

        setFetchError(false);
      } catch (error) {
        setFetchError(true);
      }
    };
    fetch();
  }, [grantIds]);

  const showGoals = isRecipientReport && hasGrants;

  const addNewGoal = () => {
    toggleGoalForm(false);
    setValue('goalForEditing', newGoal(grantIds));
  };

  const onRemove = (goalId) => {
    const copyOfSelectedGoals = selectedGoals.map((goal) => ({ ...goal }));
    const index = copyOfSelectedGoals.findIndex((goal) => goal.id === goalId);

    if (index !== -1) {
      copyOfSelectedGoals.splice(index, 1);
    }

    onUpdateGoals(copyOfSelectedGoals);
  };

  const onEdit = (goal, index) => {
    const currentlyEditing = getValues('goalForEditing') ? { ...getValues('goalForEditing') } : null;
    if (currentlyEditing) {
      const goalForEditingObjectives = getValues('goalForEditing.objectives') ? [...getValues('goalForEditing.objectives')] : [];
      const name = getValues('goalName');
      const endDate = getValues('goalEndDate');

      const areGoalsValid = validateGoals(
        [{
          ...currentlyEditing,
          name,
          endDate,
          objectives: goalForEditingObjectives,
        }],
        setError,
      );
      if (areGoalsValid !== true) {
        return;
      }
    }

    // make this goal the editable goal
    setValue('goalForEditing', goal);
    const objectives = getValues(`goals[${index}].objectives`) || [];

    setValue('goalForEditing.objectives', objectives);
    setValue('goalEndDate', goal.endDate);
    setValue('goalName', goal.name);

    toggleGoalForm(false);

    // remove the goal from the "selected goals"
    const copyOfSelectedGoals = selectedGoals.map((g) => ({ ...g }));
    copyOfSelectedGoals.splice(index, 1);
    if (currentlyEditing) {
      copyOfSelectedGoals.push(currentlyEditing);
    }

    onUpdateGoals(copyOfSelectedGoals);
  };

  // the read only component expects things a little differently
  const goalsForReview = selectedGoals.map((goal, index) => {
    const fieldArrayName = `goals[${index}].objectives`;
    const objectives = getValues(fieldArrayName) || [];
    return {
      ...goal,
      goalName: goal.name,
      grants: [],
      objectives,
    };
  });

  // we need to figure out our options based on author/collaborator roles
  const collaborators = watch('activityReportCollaborators');
  const author = watch('author');

  // create an exclusive set of roles
  // from the collaborators & author
  const roles = useMemo(() => {
    const collabs = collaborators || [];
    const auth = author || { roles: [] };
    const authorRoles = auth.roles.map((r) => r.fullName);

    const collaboratorRoles = collabs.map((c) => (
      c.collaboratorRoles ? c.collaboratorRoles.map((r) => r.fullName) : []
    )).flat();

    return Array.from(
      new Set(
        [...collaboratorRoles, ...authorRoles],
      ),
    );
  }, [author, collaborators]);

  return (
    <>
      <Helmet>
        <title>Goals and objectives</title>
      </Helmet>
      <p className="usa-prose">
        <Req className="margin-right-1" />
        indicates required field
      </p>
      {/**
        * on non-recipient reports, only objectives are shown
      */}
      {!isRecipientReport && (<OtherEntity roles={roles} />)}

      {(isRecipientReport && !showGoals) && (
      <Alert type="info" noIcon>
        <p className="usa-prose">To create goals, first select a recipient.</p>
      </Alert>
      )}

      {/**
        * all goals for review
      */}
      { goalsForReview.length ? (
        <ReadOnly
          onEdit={onEdit}
          onRemove={onRemove}
          createdGoals={goalsForReview}
        />
      ) : null }

      {/**
        * conditionally show the goal picker
      */}
      {showGoals && !isGoalFormClosed
        ? (
          <>
            <h3 className="margin-bottom-0 margin-top-4">Goal summary</h3>
            { fetchError && (<ConnectionError />)}
            <Fieldset className="margin-0">
              <GoalPicker
                grantIds={grantIds}
                availableGoals={availableGoals}
                roles={roles}
                reportId={reportId}
              />
            </Fieldset>
          </>
        ) : (
          null
        ) }

      {/**
        * we show the add new goal button if we are reviewing existing goals
        * and if the report HAS goals
        */}
      {showGoals && isGoalFormClosed && isRecipientReport
        ? (
          <PlusButton onClick={addNewGoal} text="Add new goal" />
        ) : (
          null
        ) }
    </>
  );
};

GoalsObjectives.propTypes = {
  reportId: PropTypes.number.isRequired,
};

const ReviewSection = () => {
  const { watch } = useFormContext();
  const {
    activityRecipientType,
  } = watch();

  const otherEntity = activityRecipientType === 'other-entity';

  return (
    <>
      {!otherEntity
        && <RecipientReviewSection />}
      {otherEntity
        && <OtherEntityReviewSection />}
    </>
  );
};

export default {
  position: 2,
  label: 'Goals and objectives',
  titleOverride: (formData) => {
    const { activityRecipientType } = formData;
    if (activityRecipientType === 'other-entity') {
      return 'Objectives and topics';
    }
    return 'Goals and objectives';
  },
  path: 'goals-objectives',
  review: false,
  isPageComplete: (formData) => {
    const { activityRecipientType } = formData;

    if (!activityRecipientType) {
      return false;
    }

    if (activityRecipientType === 'other-entity') {
      return validateObjectives(formData.objectivesWithoutGoals) === true;
    }
    return activityRecipientType !== 'recipient' || validateGoals(formData.goals) === true;
  },
  reviewSection: () => <ReviewSection />,
  render: (_additionalData, _formData, reportId) => (

    <GoalsObjectives
      reportId={reportId}
    />
  ),
};
