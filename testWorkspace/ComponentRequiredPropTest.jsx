import React from 'react';
import PropTypes from 'prop-types';

export default class MainComponent extends React.Component {
    render() {
        return (
            <div className="thursday">
                <ComponentWithRequiredProp />
            </div>
        );
    }
}

class ComponentWithRequiredProp extends React.Component {
  static propTypes = {
      boolProp: PropTypes.bool.isRequired
  };

  render() {
      return (
          <div className="classislav">
              <h1>Turnstile is: {this.props.boolProp}</h1>
          </div>
      );
  }
}