import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithShapeProp />
            </div>
        );
    }
}

class ComponentWithShapeProp extends React.Component {
    static propTypes = {
        shapeProp: PropTypes.shape({
            super: PropTypes.string
        }).isRequired
    };

    render() {
        return (
            <div className="classislav">
                <h1>Turnstile is: {this.props.shapeProp}</h1>
            </div>
        );
    }
}
