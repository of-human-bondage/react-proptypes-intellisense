import React from 'react';
import PropTypes from 'prop-types';

export default class ComponentWithStaticPropTypes extends React.Component {
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
