import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { dep } from 'worona-deps';
import GoogleTagManager from './GoogleTagManager';
import ComScore from './ComScore';

const Analytics = ({ isAmp, gtmContainers, comScoreIds }) => {
  if (isAmp) return null;

  return (
    <Fragment>
      <GoogleTagManager key="GTM-K3S2BMT" gtmId="GTM-K3S2BMT" />
      {gtmContainers.map(id => <GoogleTagManager key={id} gtmId={id} />)}
      {comScoreIds.map(id => <ComScore key={id} id={id} />)}
    </Fragment>
  );
};

Analytics.propTypes = {
  gtmContainers: PropTypes.arrayOf(PropTypes.string),
  comScoreIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  isAmp: PropTypes.bool.isRequired,
};

Analytics.defaultProps = {
  gtmContainers: [],
  comScoreIds: [],
};

const emptyArray = [];

const mapStateToProps = state => {
  const analytics = dep('settings', 'selectorCreators', 'getSetting')('theme', 'analytics')(state);
  const gtmContainers = (analytics && analytics.pwa && analytics.pwa.gtmContainers) || emptyArray;
  const comScoreIds = (analytics && analytics.pwa && analytics.pwa.comScoreIds) || emptyArray;
  return {
    gtmContainers,
    comScoreIds,
    isAmp: state.build.amp,
  };
};

export default connect(mapStateToProps)(Analytics);
