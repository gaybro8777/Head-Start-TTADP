import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@trussworks/react-uswds';
import withWidgetData from './withWidgetData';
import Container from '../components/Container';
import './Overview.css';

function Field({
  label, labelExt, data, col,
}) {
  return (
    <Grid col={col} className="smart-hub--overview">
      <span className="text-bold smart-hub--overview-font-size">{data}</span>
      <br />
      {label}
      <span className="smart-hub--overview-nowrap">{labelExt}</span>
    </Grid>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  labelExt: PropTypes.string,
  data: PropTypes.string,
  col: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

Field.defaultProps = {
  labelExt: '',
  col: 2,
  data: '',
};

/*
  Widgets only have to worry about presenting data. Filtering of the data happens at a
  higher level, which is why this component is wrapped with `withWidgetData`. `withWidgetData`
  takes care of fetching data, flagging the component as loading and handling errors while
  fetching data. Widgets are only rendered after data has been successfully loaded from the
  API. Note the `example` passed as a 2nd parameter to `withWidgetData` must match the widget
  id in the backend `src/widgets/index.js` file or you will get 404s.
*/
function Overview({
  data, loading, tableCaption,
}) {
  const title = !tableCaption ? 'TTA overview' : tableCaption;
  return (
    <Container loading={loading} loadingLabel="Overview loading">
      <Grid row className="smart-hub--overview-header">
        <h2>
          {title}
        </h2>
      </Grid>
      <Grid row gap className="smart-hub--overview-data">
        <Field col="fill" tablet={{ col: true }} label="Grants served " data={data.numGrants} />
        <Field col="fill" label="Other entities served" data={data.numOtherEntities} />
        <Field col="fill" label="Activity reports" data={data.numReports} />
        <Field col="fill" label="Participants" data={data.numParticipants} />
        <Field col={2} label="Hours of TTA" data={data.sumDuration} decimalPlaces={1} />
      </Grid>
    </Container>
  );
}

Overview.propTypes = {
  data: PropTypes.shape({
    numReports: PropTypes.string,
    numGrants: PropTypes.string,
    numOtherEntities: PropTypes.string,
    numTotalGrants: PropTypes.string,
    numParticipants: PropTypes.string,
    sumDuration: PropTypes.string,
  }),
  loading: PropTypes.bool.isRequired,
  tableCaption: PropTypes.string,
};

Overview.defaultProps = {
  data: {
    numReports: '0',
    numGrants: '0',
    numOtherEntities: '0',
    numTotalGrants: '0',
    numParticipants: '0',
    sumDuration: '0',
  },
  tableCaption: null,
};

export default withWidgetData(Overview, 'overview');
