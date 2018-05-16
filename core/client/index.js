/* eslint-disable global-require, no-underscore-dangle, import/no-dynamic-require */
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { types } from 'mobx-state-tree';
import { AppContainer } from 'react-hot-loader';
import { hydrate } from 'react-emotion';
import { addPackage } from 'worona-deps';
import App from '../components/App';
import { importPromises } from '../components/Universal';
import Store from '../store';

const dev = process.env.NODE_ENV !== 'production';

const buildModule = require(`../packages/build/${process.env.MODE}`);
const settingsModule = require(`../packages/settings/${process.env.MODE}`);
const analyticsModule = require(`../packages/analytics/${process.env.MODE}`);
const iframesModule = require(`../packages/iframes/${process.env.MODE}`);
const adsModule = require(`../packages/ads/${process.env.MODE}`);
const customCssModule = require(`../packages/customCss/${process.env.MODE}`);

// Define core modules.
const coreModules = [
  { name: 'build', namespace: 'build', module: buildModule },
  { name: 'settings', namespace: 'settings', module: settingsModule },
  { name: 'analytics', namespace: 'analytics', module: analyticsModule },
  { name: 'iframes', namespace: 'iframes', module: iframesModule },
  { name: 'ads', namespace: 'ads', module: adsModule },
  { name: 'customCss', namespace: 'customCss', module: customCssModule },
];

// Get activated packages.
const packages = Object.values(window['wp-pwa'].initialStateRedux.build.packages);

let stores = null;

const render = Component => {
  ReactDOM.hydrate(
    <AppContainer>
      <Component
        core={coreModules.map(({ name, module }) => ({
          name,
          Component: module.default,
        }))}
        packages={packages}
        stores={stores}
      />
    </AppContainer>,
    document.getElementById('root'),
  );
};

const init = async () => {
  // Adds server generated styles to emotion cache.
  hydrate(window['wp-pwa'].emotionIds);

  // Wait for activated packages.
  const pkgEntries = Object.entries(window['wp-pwa'].initialStateRedux.build.packages);
  const pkgPromises = pkgEntries.map(([namespace, name]) => importPromises({ name, namespace }));
  const pkgModules = await Promise.all(pkgPromises);

  const storesProps = {};

  const addModules = pkg => {
    addPackage({ namespace: pkg.namespace, module: pkg.module });
  };

  // Add packages to worona-devs.
  coreModules.forEach(addModules);
  pkgModules.forEach(addModules);

  const mapModules = pkg => {
    if (pkg.module.Store) storesProps[pkg.namespace] = types.optional(pkg.module.Store, {});
  };

  // Load MST reducers and server sagas.
  coreModules.forEach(mapModules);
  pkgModules.forEach(mapModules);

  // Create MST Stores and pass redux as env variable.
  const Stores = Store.props(storesProps);
  stores = Stores.create(window['wp-pwa'].initialState);
  if (dev) {
    const makeInspectable = require('mobx-devtools-mst').default;
    makeInspectable(stores);
  }
  // Add both to window
  if (typeof window !== 'undefined') window.frontity = { stores };
  // Start all the client sagas.
  stores.clientStarted();
  // Start App.
  render(App);
  // Inform that the client has been rendered.
  stores.clientRendered();
};

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('../components/App.js', () => {
    const Component = require('../components/App').default;
    render(Component);
  });
  module.hot.accept('../components/Universal.js', () => {
    const Component = require('../components/App').default;
    render(Component);
  });
}

init();
