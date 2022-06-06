import moment from 'moment';
import { convert } from 'html-to-text';
import { DATE_FORMAT } from '../constants';

function transformDate(field) {
  function transformer(instance) {
    let value = '';
    const date = instance[field];
    if (date) {
      value = moment(date).format(DATE_FORMAT);
    }
    const obj = {};
    Object.defineProperty(obj, field, {
      value,
      enumerable: true,
    });
    return obj;
  }
  return transformer;
}

/**
 * @param {string} field name to be retrieved
 * @returns {function} Function that will return a simple value wrapped in a Promise
 */
function transformSimpleValue(instance, field) {
  let value = instance[field];
  if (value && Array.isArray(value)) {
    // sort the values
    value = value.sort().join('\n');
  }
  const obj = {};
  Object.defineProperty(obj, field, {
    value,
    enumerable: true,
  });
  return obj;
}

/*
 * Generates a function that can transform values of a related model
 * @param {string} field The field of the related model
 * @param {string} prop The key on the related model to transform
 * @returns {function} A function that will perform the transformation
 */
function transformRelatedModel(field, prop) {
  function transformer(instance) {
    const obj = {};
    let records = instance[field];
    if (records) {
      if (!Array.isArray(records)) {
        records = [records];
      }
      // we sort the values
      const value = records.map((r) => (r[prop] || '')).sort().join('\n');
      Object.defineProperty(obj, field, {
        value,
        enumerable: true,
      });
    }
    return obj;
  }
  return transformer;
}

function transformCollaborators(joinTable, field, fieldName) {
  function transformer(instance) {
    const obj = {};
    let records = instance[joinTable];
    if (records) {
      if (!Array.isArray(records)) {
        records = [records];
      }
      const value = records.map((r) => r[field]).sort().join('\n');
      Object.defineProperty(obj, fieldName, {
        value,
        enumerable: true,
      });
    }
    return obj;
  }
  return transformer;
}

function transformHTML(field) {
  function transformer(instance) {
    const html = instance[field] || '';
    const value = convert(html, { selectors: [{ selector: 'table', format: 'dataTable' }] });
    const obj = {};
    Object.defineProperty(obj, field, {
      value,
      enumerable: true,
    });
    return obj;
  }
  return transformer;
}

function transformApproversModel(prop) {
  function transformer(instance) {
    const obj = {};
    const values = instance.approvers;
    if (values) {
      const distinctValues = [
        ...new Set(
          values.filter(
            (approver) => approver.User && approver.User[prop] !== null,
          ).map((r) => r.User[prop]).flat(),
        ),
      ];
      const approversList = distinctValues.sort().join('\n');
      Object.defineProperty(obj, 'approvers', {
        value: approversList,
        enumerable: true,
      });
    }
    return obj;
  }
  return transformer;
}

function transformGrantModel(prop) {
  function transformer(instance) {
    const obj = {};
    const values = instance.activityRecipients;
    if (values) {
      const distinctValues = [
        ...new Set(
          values.filter(
            (recipient) => recipient.grant && recipient.grant[prop] !== null,
          ).map((r) => r.grant[prop]).flat(),
        ),
      ];
      const grantValueList = distinctValues.sort().join('\n');
      Object.defineProperty(obj, prop, {
        value: grantValueList,
        enumerable: true,
      });
    }
    return obj;
  }
  return transformer;
}

/*
   * Helper function for transformGoalsAndObjectives
   */
function sortObjectives(a, b) {
  if (!b.goal || !a.goal) {
    return 1;
  }
  if (b.goal.id < a.goal.id) {
    return 1;
  }
  if (b.id < a.id) {
    return 1;
  }
  return -1;
}

/*
   * Create an object with goals and objectives. Used by transformGoalsAndObjectives
   * @param {Array<Objectives>} objectiveRecords
   */
// TODO: ttaProvided needs to move from ActivityReportObjective to ActivityReportObjective
function makeGoalsAndObjectivesObject(objectiveRecords) {
  objectiveRecords.sort(sortObjectives);
  let objectiveNum = 0;
  let goalNum = 0;

  return objectiveRecords.reduce((accum, objective) => {
    const {
      goal, title, status, activityReportObjectives,
    } = objective;
    const goalName = goal ? goal.name : null;
    const newGoal = goalName && !Object.values(accum).includes(goalName);

    if (newGoal) {
      goalNum += 1;
      Object.defineProperty(accum, `goal-${goalNum}`, {
        value: goalName,
        enumerable: true,
      });
      // Object.defineProperty(accum, `goal-${goalNum}-status`, {
      //   value: goal.status,
      //   enumerable: true,
      // });
      objectiveNum = 1;
    }

    // goal number should be at least 1
    if (!goalNum) {
      goalNum = 1;
    }

    // same with objective num

    /**
     * this will start other entity objectives at 1.1, which will prevent the creation
     * of columns that don't fit the current schema (for example, objective-1.0)
     */
    if (!objectiveNum) {
      objectiveNum = 1;
    }

    const objectiveId = `${goalNum}.${objectiveNum}`;

    Object.defineProperty(accum, `objective-${objectiveId}`, {
      value: title,
      enumerable: true,
    });
    Object.defineProperty(accum, `objective-${objectiveId}-status`, {
      value: status,
      enumerable: true,
    });
    Object.defineProperty(accum, `objective-${objectiveId}-ttaProvided`, {
      value: convert(activityReportObjectives.map((aro) => aro.ttaProvided).join('\n')),
      enumerable: true,
    });
    objectiveNum += 1;

    return accum;
  }, {});
}

/*
* Transform goals and objectives into a format suitable for a CSV
* @param {ActivityReport} ActivityReport instance
* @returns {Promise<object>} Object with key-values for goals and objectives
*/
function transformGoalsAndObjectives(report) {
  let obj = {};
  const { activityReportObjectives } = report;
  if (activityReportObjectives) {
    const objectiveRecords = activityReportObjectives.map((aro) => aro.objective);
    if (objectiveRecords) {
      obj = makeGoalsAndObjectivesObject(objectiveRecords);
    }
  }

  return obj;
}

const arTransformers = [
  'displayId',
  'creatorName',
  transformRelatedModel('lastUpdatedBy', 'name'),
  'requester',
  transformCollaborators('activityReportCollaborators', 'fullName', 'collaborators'),
  transformApproversModel('name'),
  'targetPopulations',
  'virtualDeliveryType',
  'reason',
  'participants',
  'topics',
  'ttaType',
  'numberOfParticipants',
  'deliveryMethod',
  'duration',
  'endDate',
  'startDate',
  transformRelatedModel('activityRecipients', 'name'),
  transformGrantModel('programTypes'),
  'activityRecipientType',
  'ECLKCResourcesUsed',
  'nonECLKCResourcesUsed',
  transformRelatedModel('files', 'originalFileName'),
  transformGoalsAndObjectives,
  transformRelatedModel('recipientNextSteps', 'note'),
  transformRelatedModel('specialistNextSteps', 'note'),
  transformHTML('context'),
  transformHTML('additionalNotes'),
  'lastSaved',
  transformDate('createdAt'),
  transformDate('approvedAt'),
  transformGrantModel('programSpecialistName'),
  transformGrantModel('recipientInfo'),
];

/**
   * csvRows is an array of objects representing csv data. Sometimes,
   * some objects can have keys that other objects will not.
   * We also want the goals and objectives to appear at the end
   * of the report. This extracts a list of all the goals and objectives.
   *
   * @param {object[]} csvRows
   * @returns object[]
   */
function extractListOfGoalsAndObjectives(csvRows) {
  // an empty array to hold our keys
  let keys = [];

  // remove all the keys and get em in an array
  csvRows.forEach((row) => keys.push(Object.keys(row)));

  // flatten arrays of keys and dedupe
  keys = Array.from(new Set(keys.flat()));

  const goals = [];
  const objectives = [];

  keys.forEach((key) => {
    if (key.match(/^(goal)/)) {
      goals.push(key);
    }

    if (key.match(/^(objective)/)) {
      objectives.push(key);
    }
  });

  if (goals.length === 0) {
    return objectives;
  }

  let goalsAndObjectives = [];

  goals.forEach((goal, index, goalsArray) => {
    // push the goal to our array
    goalsAndObjectives.push(goal);

    // get the goal number
    const goalNumberNeedle = goal.split('-')[1];

    // check to see if the next goal is from the same set of goal fields
    if (goalsArray[index + 1] && goalsArray[index + 1].match(`^(goal-${goalNumberNeedle})`)) {
      return;
    }

    // find any associated objectives
    const associatedObjectives = objectives.filter((objective) => objective.match(new RegExp(`^(objective-${goalNumberNeedle})`)));

    // make em friends
    goalsAndObjectives = [...goalsAndObjectives, ...associatedObjectives];
  });

  return goalsAndObjectives;
}

function activityReportToCsvRecord(report, transformers = arTransformers) {
  const callFunctionOrValueGetter = (x) => {
    if (typeof x === 'function') {
      return x(report);
    }
    if (typeof x === 'string') {
      return transformSimpleValue(report, x);
    }
    return {};
  };
  const recordObjects = transformers.map(callFunctionOrValueGetter);
  const record = recordObjects.reduce((obj, value) => Object.assign(obj, value), {});

  return record;
}

export {
  activityReportToCsvRecord,
  arTransformers,
  makeGoalsAndObjectivesObject,
  extractListOfGoalsAndObjectives,
};
