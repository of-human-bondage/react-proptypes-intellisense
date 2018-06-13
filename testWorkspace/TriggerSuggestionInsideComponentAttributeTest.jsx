import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <TestComponent funcProp={() => {
                  console.log('cleofrom5to7');
                }}/>
            </div>
        );
    }
}

class TestComponent extends React.Component {
    render() {
        return (
            <div className="classislav">
                <h1>Turnstile is: {this.props.shapeProp}</h1>
            </div>
        );
    }
}

TestComponent.propTypes = {
    boolProp: PropTypes.bool,
    funcProp: PropTypes.func
};
