import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import Graph from './Graph'
import CanvasGraph from './CanvasGraph'

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <Graph/>
            <CanvasGraph/>
          </div>
          <p>
            WTF Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
