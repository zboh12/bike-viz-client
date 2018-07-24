import React from 'react';
import { Route } from 'react-router-dom'
import Map from '../map'
import Controls from '../controls'

const App = () => (
  <div>
    <main>
      <Route exact path="/map" component={Map} />
      <Route exact path="/controls" component={Controls} />
    </main>
  </div>
)

export default App
