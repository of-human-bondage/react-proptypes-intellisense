import React from 'react';
import PropTypes from 'prop-types';

export default class ComponentToImport extends React.Component {
    render() {
        return (
            <div className="classislav">
                <h1>Turnstile is: {this.props.isGood}</h1>
            </div>
        );
    }
}

ComponentToImport.propTypes = {
    boolProp: PropTypes.bool,
    funcProp: PropTypes.func,
    objectProp: PropTypes.object
};
