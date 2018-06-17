import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithPropsInPrototype />
            </div>
        );
    }
}

class ComponentWithPropsInPrototype extends React.Component {
    render() {
        return (
            <div className="classislav">
                <h1>Turnstile is: {this.props.isGood}</h1>
            </div>
        );
    }
}

ComponentWithPropsInPrototype.prototype.propTypes = {
    boolProp: PropTypes.bool,
    funcProp: PropTypes.func,
    objectProp: PropTypes.object
};