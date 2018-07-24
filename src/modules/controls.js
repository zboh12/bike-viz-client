import { combineReducers } from 'redux'
import 'whatwg-fetch'
import { evt } from '../helpers/eventTypes'

function reset () {
  return (dispatch) => {
    dispatch({
      type: evt.RESET
    })
  }
}

function updateStartTimestamp (time) {
  return (dispatch) => {
    dispatch({
      type: evt.UPDATED_START_TIMESTAMP,
      payload: time
    })
  }
}

function updateEndTimestamp (time) {
  return (dispatch) => {
    dispatch({
      type: evt.UPDATED_END_TIMESTAMP,
      payload: time
    })
  }
}

function setTimeInterval (start, end) {
  return (dispatch) => {
    dispatch({
      type: evt.LOADING
    })
    dispatch({
      type: evt.SET_DAYS,
      payload: Math.ceil((end - start) / 86400000)
    })
  }
}

function removeLoader () {
  return (dispatch) => {
    dispatch({
      type: evt.DONE_LOADING
    })
  }
}

function displayTrip (trip) {
  return (dispatch) => {
    dispatch({
      type: evt.DISPLAY_TRIP,
      payload: trip
    })
  }
}

function displayTripCount (numTrips) {
  return (dispatch) => {
    dispatch({
      type: evt.DISPLAY_TRIP_COUNT,
      payload: numTrips
    })
  }
}

function setControlTime (newTime) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_CONTROL_TIME,
      payload: newTime
    })
  }
}

function setStartTime (startTime) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_START_TIME,
      payload: startTime
    })
  }
}

// reducers

function controlTime (state = null, action) {
  switch (action.type) {
    case evt.SET_CONTROL_TIME:
      return action.payload
    case evt.RESET:
      return null
    default:
      return state
  }
}

function startTime (state = null, action) {
  switch (action.type) {
    case evt.SET_START_TIME:
      return action.payload
    case evt.RESET:
      return null
    default:
      return state
  }
}

function startTimestamp (state = null, action) {
  switch (action.type) {
    case evt.UPDATED_START_TIMESTAMP:
      return action.payload
    case evt.RESET:
      return null
    default:
      return state
  }
}

function endTimestamp (state = null, action) {
  switch (action.type) {
    case evt.UPDATED_END_TIMESTAMP:
      return action.payload
    case evt.RESET:
      return null
    default:
      return state
  }
}

function trips (state = [], action) {
  switch (action.type) {
    case evt.DISPLAY_TRIP:
      let newState = state.slice()
      newState.push(action.payload)
      return newState
    default:
      return state
  }
}

function tripCount (state = 0, action) {
  switch (action.type) {
    case evt.DISPLAY_TRIP_COUNT:
      return action.payload
    case evt.RESET:
      return 0
    default:
      return state
  }
}

function days (state = 1, action) {
  switch (action.type) {
    case evt.SET_DAYS:
      return action.payload
    default:
      return state
  }
}

function loading (state = false, action) {
  switch (action.type) {
    case evt.LOADING:
      return true
    case evt.DONE_LOADING:
      return false
    default:
      return state
  }
}

export const actions = {
  updateStartTimestamp,
  updateEndTimestamp,
  setTimeInterval,
  displayTrip,
  displayTripCount,
  removeLoader,
  setControlTime,
  setStartTime,
  reset
}

export default combineReducers({
  startTimestamp,
  endTimestamp,
  trips,
  tripCount,
  loading,
  controlTime,
  startTime,
  days
})
