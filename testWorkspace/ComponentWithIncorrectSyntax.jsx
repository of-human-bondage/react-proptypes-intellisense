import React from 'react';
import PropTypes from 'prop-types';

import ComponentToImport from './ComponentToImport';

export default class ComponentWithoutProps extends React.Component {
    render() {
        return (
            <div className="classislav">
                <ComponentToImport boolProp={} ></ComponentToImport>
            </div>
        );
    }
}