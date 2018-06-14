import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <TestComponent
                    boolProp={true}
                    objectProp={{ film: 'bandOfOutsiders' }}
                    funcProp={() => {
                        console.log('cleofrom5to7');
                    }}
                    
                />
            </div>
        );
    }
}

export default class TestComponent extends React.Component {
    static propTypes = {
        boolProp: PropTypes.bool,
        funcProp: PropTypes.func,
        objectProp: PropTypes.object
    };

    render() {
        return (
            <div className="classislav">
                <h1>Turnstile is: {this.props.isGood}</h1>
            </div>
        );
    }
}
