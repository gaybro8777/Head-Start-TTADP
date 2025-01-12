import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// https://github.com/plotly/react-plotly.js/issues/135#issuecomment-501398125
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
import colors from '../colors';

import './BarGraph.css';

const Plot = createPlotlyComponent(Plotly);
const WIDGET_PER_CATEGORY = 180;

/**
 *
 * Takes a string, a reason (or topic, if you prefer)
 * provided for an activity report and intersperses it with line breaks
 * depending on the length
 *
 * @param {string} topic
 * @returns string with line breaks
 */
function topicsWithLineBreaks(reason) {
  const arrayOfTopics = reason.split(' ');

  return arrayOfTopics.reduce((accumulator, currentValue) => {
    const lineBreaks = accumulator.match(/<br>/g);
    const allowedLength = lineBreaks ? lineBreaks.length * 6 : 6;

    // we don't want slashes on their own lines
    if (currentValue === '/' || currentValue === '|' || currentValue === '&') {
      return `${accumulator} ${currentValue}`;
    }

    if (accumulator.length > allowedLength) {
      return `${accumulator}<br>${currentValue}`;
    }

    return `${accumulator} ${currentValue}`;
  }, '');
}

function BarGraph({ data, yAxisLabel, xAxisLabel }) {
  const [plot, updatePlot] = useState({});

  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      return;
    }

    const categories = [];
    const counts = [];

    data.forEach((dataPoint) => {
      categories.push(dataPoint.category);
      counts.push(dataPoint.count);
    });

    const trace = {
      type: 'bar',
      x: categories.map((category) => topicsWithLineBreaks(category)),
      y: counts,
      hoverinfo: 'y',
      marker: {
        color: colors.ttahubMediumBlue,
      },
    };

    const width = categories.length * WIDGET_PER_CATEGORY;

    const layout = {
      bargap: 0.5,
      height: 300,
      hoverlabel: {
        bgcolor: '#000',
        bordercolor: '#000',
        font: {
          color: '#fff',
          size: 16,
        },
      },
      font: {
        color: '#1b1b1b',
      },
      width,
      margin: {
        l: 80,
        pad: 20,
        t: 24,
      },
      xaxis: {
        automargin: true,
        fixedrange: true,
        tickangle: 0,
      },
      yaxis: {
        tickformat: ',.0d',
        fixedrange: true,
      },
      hovermode: 'none',
    };

    updatePlot({
      data: [trace],
      layout,
      config: {
        responsive: true, displayModeBar: false, hovermode: 'none',
      },
    });
  }, [data]);

  return (
    <>
      <div className="display-flex flex-align-center">
        <div className="margin-right-1 smart-hub--vertical-text">
          { yAxisLabel }
        </div>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div className="overflow-x-scroll" tabIndex={0}>
          <span className="sr-only">Use the arrow keys to scroll graph</span>
          <Plot
            data={plot.data}
            layout={plot.layout}
            config={plot.config}
          />
        </div>
      </div>
      <div className="display-flex flex-justify-center margin-top-1">
        { xAxisLabel }
      </div>
    </>
  );
}

BarGraph.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string,
      count: PropTypes.number,
    }),
  ),
  yAxisLabel: PropTypes.string.isRequired,
  xAxisLabel: PropTypes.string.isRequired,
};

BarGraph.defaultProps = {
  data: [],
};

export default BarGraph;
