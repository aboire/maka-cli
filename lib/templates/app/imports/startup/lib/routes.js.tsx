/**
 * The React Router client/server side routing definitions.
 * @namespace Client.Routes
 * @desc This is the main definition for the react router. Version 3.x
 */
import * as React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import * as Component from './templates';

const Routes = (props:any) => (
    <Router history={ props.history }>
        <Route path="*" component={ Component.MasterLayout }>
            <IndexRoute component={ Component.NotFound }/>
        </Route>
    </Router>
);
export default Routes;
