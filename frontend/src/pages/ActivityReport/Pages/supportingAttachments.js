import React from 'react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form/dist/index.ie11';
import { Helmet } from 'react-helmet';
import {
  Fieldset, Label,
} from '@trussworks/react-uswds';
import Section from './Review/ReviewSection';
import FileReviewItem from './Review/FileReviewItem';
import FileUploader from '../../../components/FileUploader';
import { reportIsEditable } from '../../../utils';

const SupportingAttachments = ({
  reportId,
}) => {
  const { control } = useFormContext();

  return (
    <>
      <Helmet>
        <title>Supporting attachments</title>
      </Helmet>
      <Fieldset className="smart-hub--report-legend margin-top-4">
        <div id="attachments" />
        <Label className="margin-top-0" htmlFor="attachments">
          Upload any relevant attachments, such as:
          <ul className="margin-top-0 padding-left-4">
            <li>meetings agendas</li>
            <li>services plans</li>
            <li>sign-in or attendance sheets</li>
            <li>other items not available online</li>
          </ul>
        </Label>

        <span className="usa-hint font-sans-3xs">File types accepted:</span>
        <br />
        <span className="usa-hint font-sans-3xs">images, .pdf, .docx, .xlsx, .pptx, .doc, .xls, .ppt, .zip, .txt, .csv (max size 30 MB)</span>
        <Controller
          name="attachments"
          defaultValue={[]}
          control={control}
          render={({ onChange, value }) => (
            <FileUploader files={value} onChange={onChange} reportId={reportId} id="attachments" />
          )}
        />
      </Fieldset>
    </>
  );
};

SupportingAttachments.propTypes = {
  reportId: PropTypes.node.isRequired,
};

const ReviewSection = () => {
  const { watch } = useFormContext();
  const {
    attachments,
    calculatedStatus,
  } = watch();

  const hasAttachments = attachments && attachments.length > 0;
  const canEdit = reportIsEditable(calculatedStatus);

  return (
    <>
      <Section
        hidePrint={!hasAttachments}
        key="Attachments"
        basePath="supporting-attachments"
        anchor="attachments"
        title="Attachments"
        canEdit={canEdit}
      >
        {attachments.map((file) => (
          <FileReviewItem
            key={file.url.url}
            filename={file.originalFileName}
            url={file.url.url}
            status={file.status}
          />
        ))}
      </Section>
    </>
  );
};

export default {
  position: 2,
  label: 'Supporting attachments',
  path: 'supporting-attachments',
  reviewSection: () => <ReviewSection />,
  review: false,
  render: (_additionalData, _formData, reportId) => (
    <SupportingAttachments
      reportId={reportId}
    />
  ),
};
