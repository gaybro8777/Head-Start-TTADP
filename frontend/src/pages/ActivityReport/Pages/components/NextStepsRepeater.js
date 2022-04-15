import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import {
  Label, Button, Textarea,
} from '@trussworks/react-uswds';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlusCircle } from '@fortawesome/free-solid-svg-icons';

export default function NextStepsRepeater({
  nextSteps,
  setNextSteps,
}) {
  const nextStepsWrapper = useRef();

  const addNextStep = () => {
    const newNextStep = [...nextSteps, { key: uuidv4(), value: '' }];
    setNextSteps(newNextStep);
  };

  const removeNextStep = (i) => {
    const newSteps = [...nextSteps];
    newSteps.splice(i, 1);
    setNextSteps(newSteps);
  };

  const updateNextStep = (value, i) => {
    const newSteps = [...nextSteps];
    const toUpdate = { ...newSteps[i], value };
    newSteps.splice(i, 1, toUpdate);
    setNextSteps(newSteps);
  };

  return (
    <>
      <div ref={nextStepsWrapper}>
        <div className="ttahub-next-steps-repeater">
          { nextSteps.map((s, i) => (
            <div key={s.key} className="display-flex" id="next-steps">
              <Label htmlFor={`next-step-${i + 1}`} className="sr-only">
                Next step
                {' '}
                { i + 1 }
              </Label>
              <Textarea
                className="maxh-10 smart-hub--text-area__resize-vertical"
                name={`next-steps-text-${i + 1}`}
                key={`next-steps-text-${i + 1}`}
                type="text"
                value={s.value}
                onChange={({ target: { value } }) => updateNextStep(value, i)}
              />
              { nextSteps.length > 1 ? (
                <Button className="margin-top-0" unstyled type="button" onClick={() => removeNextStep(i)}>
                  <FontAwesomeIcon className="margin-x-1" color="#005ea2" icon={faTrash} />
                  <span className="sr-only">
                    remove step
                    {' '}
                    { i + 1 }
                  </span>
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="margin-05 margin-bottom-4">
          <Button type="button" unstyled onClick={addNextStep}>
            <FontAwesomeIcon className="margin-right-1" color="#005ea2" icon={faPlusCircle} />
            Add next step
          </Button>
        </div>
      </div>
    </>
  );
}

NextStepsRepeater.propTypes = {
  nextSteps: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.string,
  })).isRequired,
  setNextSteps: PropTypes.func.isRequired,
};
