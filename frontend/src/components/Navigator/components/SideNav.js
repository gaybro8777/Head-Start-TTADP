/*
  Stickied left nav for the navigator. Should not have any state, just displays
  the nav items passed in as props. This component has lots of custom styles
  defined. Note the nav is no longer stickied once we hit mobile widths (640px)
*/
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { startCase } from 'lodash';
import Sticky from 'react-stickynode';
import { Button, Tag, Alert } from '@trussworks/react-uswds';
import { useMediaQuery } from 'react-responsive';
import moment from 'moment';

import Container from '../../Container';
import './SideNav.css';
import { REPORT_STATUSES } from '../../../Constants';
import {
  NOT_STARTED, IN_PROGRESS, COMPLETE,
} from '../constants';

const tagClass = (state) => {
  switch (state) {
    case NOT_STARTED:
      return 'smart-hub--tag-not-started';
    case IN_PROGRESS:
      return 'smart-hub--tag-in-progress';
    case COMPLETE:
      return 'smart-hub--tag-complete';
    case REPORT_STATUSES.SUBMITTED:
      return 'smart-hub--tag-submitted';
    case REPORT_STATUSES.APPROVED:
      return 'smart-hub--tag-approved';
    case REPORT_STATUSES.NEEDS_ACTION:
      return 'smart-hub--tag-needs-action';
    default:
      return '';
  }
};

function SideNav({
  pages, skipTo, skipToMessage, lastSaveTime, errorMessage, savedToStorage,
}) {
  const [fade, updateFade] = useState(true);

  useEffect(() => {
    updateFade(true);
  }, [lastSaveTime, errorMessage]);

  const isMobile = useMediaQuery({ maxWidth: 1023 });
  const navItems = () => pages.map((page) => (
    <li key={page.label} className="smart-hub--navigator-item">
      <Button
        onClick={page.onNavigation}
        unstyled
        className={`smart-hub--navigator-link ${page.current ? 'smart-hub--navigator-link-active' : ''}`}
        role="button"
      >
        <span className="margin-left-2">{page.label}</span>
        <span className="margin-left-auto margin-right-2">
          {page.state !== REPORT_STATUSES.DRAFT
            && (
              <Tag className={`smart-hub--tag ${tagClass(page.state)}`}>
                {startCase(page.state)}
              </Tag>
            )}
        </span>
      </Button>
    </li>
  ));

  const onAnimationEnd = () => updateFade(false);
  const DATE_DISPLAY_SAVED_FORMAT = 'MM/DD/YYYY [at] h:mm a';

  return (
    <Sticky className="smart-hub-sidenav" top={100} enabled={!isMobile}>
      <Container padding={0}>
        <a className="smart-hub--navigator-skip-link" href={`#${skipTo}`}>{skipToMessage}</a>
        <ul className="smart-hub--navigator-list">
          {navItems()}
        </ul>
      </Container>
      {errorMessage
        && (
          <Alert type="error" onAnimationEnd={onAnimationEnd} slim noIcon className={`smart-hub--save-alert ${fade ? 'alert-fade' : ''}`}>
            {errorMessage}
          </Alert>
        )}
      {(lastSaveTime || savedToStorage) && !errorMessage
        && (
          <Alert
            onAnimationEnd={onAnimationEnd}
            aria-atomic
            aria-live="polite"
            type="success"
            slim
            noIcon
            className={`smart-hub--save-alert ${fade ? 'alert-fade' : ''}`}
          >
            { lastSaveTime && (
            <span className="margin-bottom-2">
              This report was last saved to our network on
              {' '}
              {lastSaveTime.format(DATE_DISPLAY_SAVED_FORMAT)}
            </span>
            )}
            { savedToStorage && (
            <span className="margin-bottom-2">
              This report was last saved to your local backup on
              {' '}
              {moment(savedToStorage).format(DATE_DISPLAY_SAVED_FORMAT)}
            </span>
            )}
          </Alert>
        )}
    </Sticky>
  );
}

SideNav.propTypes = {
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      state: PropTypes.string,
      current: PropTypes.bool.isRequired,
      onNavigation: PropTypes.func.isRequired,
    }),
  ).isRequired,
  skipTo: PropTypes.string.isRequired,
  skipToMessage: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
  lastSaveTime: PropTypes.instanceOf(moment),
  savedToStorage: PropTypes.string,
};

SideNav.defaultProps = {
  lastSaveTime: undefined,
  errorMessage: undefined,
  savedToStorage: undefined,
};

export default SideNav;
