import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@trussworks/react-uswds';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import './Goal.css';

const Goals = ({ name }) => (
  <div className="smart-hub--goal">
    <div className="smart-hub--goal-content">
      <p className="margin-top-0">
        <span className="text-bold">Goal: </span>
        { name }
      </p>
      <Button onClick={(e) => { e.preventDefault(); }} outline className="smart-hub--button">
        Add new Objective
      </Button>
    </div>
    <div className="margin-left-auto margin-top-2">
      <Button onClick={(e) => { e.preventDefault(); }} unstyled className="smart-hub--button" aria-label="remove goal">
        <FontAwesomeIcon color="gray" icon={faTrash} />
      </Button>
    </div>
  </div>
);

Goals.propTypes = {
  name: PropTypes.string.isRequired,
};

export default Goals;