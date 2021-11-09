import React from 'react';
import PropTypes from 'prop-types';
import {
  Tag, Checkbox,
} from '@trussworks/react-uswds';
import { Link, useHistory } from 'react-router-dom';

import ContextMenu from '../ContextMenu';
import { getReportsDownloadURL } from '../../fetchers/helpers';
import TooltipWithCollection from '../TooltipWithCollection';

function ReportRow({
  report, openMenuUp, handleReportSelect, isChecked,
}) {
  const {
    id,
    displayId,
    activityRecipients,
    startDate,
    author,
    topics,
    collaborators,
    lastSaved,
    calculatedStatus,
    legacyId,
  } = report;

  const history = useHistory();
  const authorName = author ? author.fullName : '';
  const recipients = activityRecipients && activityRecipients.map((ar) => (
    ar.grant ? ar.grant.grantee.name : ar.name
  ));

  const collaboratorNames = collaborators && collaborators.map((collaborator) => (
    collaborator.fullName));

  const viewOrEditLink = calculatedStatus === 'approved' ? `/activity-reports/view/${id}` : `/activity-reports/${id}`;
  const linkTarget = legacyId ? `/activity-reports/legacy/${legacyId}` : viewOrEditLink;

  const menuItems = [
    {
      label: 'View',
      onClick: () => { history.push(linkTarget); },
    },
  ];

  if (navigator.clipboard) {
    menuItems.push({
      label: 'Copy URL',
      onClick: async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${linkTarget}`);
      },
    });
  }

  if (!legacyId) {
    const downloadMenuItem = {
      label: 'Download',
      onClick: () => {
        const downloadURL = getReportsDownloadURL([id]);
        window.location.assign(downloadURL);
      },
    };
    menuItems.push(downloadMenuItem);
  }

  const contextMenuLabel = `Actions for activity report ${displayId}`;

  const selectId = `report-${id}`;

  return (
    <tr key={`landing_${id}`}>
      <td className="width-8">
        <Checkbox id={selectId} label="" value={id} checked={isChecked} onChange={handleReportSelect} aria-label={`Select ${displayId}`} />
      </td>
      <th scope="row" className="smart-hub--blue">
        <Link
          to={linkTarget}
        >
          {displayId}
        </Link>
      </th>
      <td>
        <TooltipWithCollection collection={recipients} collectionTitle={`recipients for ${displayId}`} />
      </td>
      <td>{startDate}</td>
      <td>
        <span className="smart-hub--ellipsis" title={authorName}>
          {authorName}
        </span>
      </td>
      <td>
        <TooltipWithCollection collection={topics} collectionTitle={`topics for ${displayId}`} />
      </td>
      <td>
        <TooltipWithCollection collection={collaboratorNames} collectionTitle={`collaborators for ${displayId}`} />
      </td>
      <td>{lastSaved}</td>
      <td>
        <Tag
          className={`smart-hub--table-tag-status smart-hub--status-${calculatedStatus}`}
        >
          {calculatedStatus === 'needs_action' ? 'Needs action' : calculatedStatus}
        </Tag>
      </td>
      <td>
        <ContextMenu label={contextMenuLabel} menuItems={menuItems} up={openMenuUp} />
      </td>
    </tr>
  );
}

export const reportPropTypes = {
  report: PropTypes.shape({
    id: PropTypes.number.isRequired,
    displayId: PropTypes.string.isRequired,
    activityRecipients: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      grant: PropTypes.shape({
        grantee: PropTypes.shape({
          name: PropTypes.string,
        }),
      }),
    })).isRequired,
    startDate: PropTypes.string.isRequired,
    author: PropTypes.shape({
      fullName: PropTypes.string,
      homeRegionId: PropTypes.number,
      name: PropTypes.string,
    }).isRequired,
    topics: PropTypes.arrayOf(PropTypes.string).isRequired,
    collaborators: PropTypes.arrayOf(PropTypes.string).isRequired,
    lastSaved: PropTypes.string.isRequired,
    calculatedStatus: PropTypes.string.isRequired,
    legacyId: PropTypes.string,
  }).isRequired,
  openMenuUp: PropTypes.bool.isRequired,
  handleReportSelect: PropTypes.func.isRequired,
  isChecked: PropTypes.bool.isRequired,
};

ReportRow.propTypes = reportPropTypes;

export default ReportRow;