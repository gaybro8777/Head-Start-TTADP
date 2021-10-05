import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './TooltipWithEllipsis.css';

export default function TooltipWithEllipsis({ collection, limit }) {
  const [showTooltip, setShowTooltip] = useState(true);
  const [cssClasses, setCssClasses] = useState('smart-hub--tooltip-with-ellipsis');

  useEffect(() => {
    setCssClasses(showTooltip ? 'smart-hub--tooltip-with-ellipsis show-tooltip' : 'smart-hub--tooltip-with-ellipsis');
  }, [showTooltip]);

  if (collection.length === 0) {
    return null;
  }

  const tooltip = (collection || []).reduce(
    (result, member) => `${result + member}\n`,
    '',
  );

  const tags = (collection || []).map((member) => (
    <span
      key={member.slice(1, limit)}
      className="smart-hub--tooltip-truncated"
    >
      {member}
      &nbsp;
    </span>
  ));

  if (collection.length === 1) {
    return (
      <span>{tooltip}</span>
    );
  }

  const onClick = () => {
    setShowTooltip(!showTooltip);
    setTimeout(() => {
      setShowTooltip(false);
    }, 1000);
  };

  return (
    <span className={cssClasses}>
      <button type="button" className="usa-button usa-button--unstyled" onClick={onClick}>
        <span className="smart-hub--ellipsis">
          {tags}
        </span>
        <span className="sr-only">Button visually reveals this content</span>
      </button>
      <div aria-hidden="true" data-testid="tooltip-with-ellipsis" className="usa-tooltip__body usa-tooltip__body--bottom">{tooltip}</div>
    </span>
  );
}

TooltipWithEllipsis.propTypes = {
  collection: PropTypes.arrayOf(PropTypes.string).isRequired,
  limit: PropTypes.number,
};

TooltipWithEllipsis.defaultProps = {
  limit: 13,
};
