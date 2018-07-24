import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'
import map from './map'
import controls from './controls'
import 'semantic-ui-css/semantic.min.css'

export default combineReducers({
  routing: routerReducer,
  mapRoute: map,
  controlsRoute: controls,
})
