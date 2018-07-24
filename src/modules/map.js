import { combineReducers } from 'redux'
import 'whatwg-fetch'
import { evt } from '../helpers/eventTypes'
import { COMPRESSION_FACTOR } from '../helpers/constants'
import { getDayOfYear, formatTripTimestamps,
  getStationStatusBuckets, fetchAllDirections } from '../helpers/helperFunctions'

function reset() {
  return (dispatch) => {
    // dispatch({
    //   type: evt.GOT_ALL_TRIP_POINTS,
    //   payload: []
    // })
    // dispatch({
    //   type: evt.SET_START_TIME,
    //   payload: null
    // })
    // dispatch({
    //   type: evt.SET_MAP_TIME,
    //   payload: null
    // })
    // dispatch({
    //   type: evt.CHANGE_VIEWPORT,
    //   payload: getInitialViewport()
    // })
    // dispatch({
    //   type: evt.FETCHED_STATION_STATUSES,
    //   payload: {}
    // })
  }
}

/***
 * Fetch the station information and update the state of
 * stations and stationScatterplotPoints
 */
function fetchStations() {
  return (dispatch) => {
    fetch('/stations').then(res => {
      return res.json()
    }).then(stationList => {
      // save stations as an object (dict) indexed by station id
      let stationDict = {}
      stationList.forEach(s => {
        stationDict[s['station_id']] = s
      })
      dispatch({
        type: evt.STATIONS_LOADED,
        payload: stationDict
      })
    })
      .catch(err => {
      console.log(err)
    })
  }
}

/***
 * Fetch the status of all the stations at the given start date
 * @param start - integer timestamp
 * @param callback
 * @returns {function(*)}
 */
function fetchStationStatuses(start, callback) {
  return (dispatch) => {
    // we only save the station statuses at the beginning of each day
    let dayOfYear = getDayOfYear(start)
    fetch('/stations/statuses/' + dayOfYear).then(res => {
      return res.json()
    }).then(statuses => {
      dispatch({
        type: evt.FETCHED_STATION_STATUSES,
        payload: statuses  // dict where station id is key
      })
      callback(statuses)
    })
      .catch(err => {
        console.log(err)
      })
  }
}

function fetchTripsBetween(stationStatuses, timeRange) {
  const start = timeRange.startTime
  const end = timeRange.endTime
  return (dispatch) => {
    startLoader(dispatch)
    fetch('/trips?start=' + start + '&end=' + end).then(res => {
      return res.json()
    }).then(trips => {
      trips = formatTripTimestamps(trips)  // convert datetime strings to milliseconds from epoch

      dispatch({
        type: evt.FETCHED_TRIPS_BETWEEN,
        payload: trips
      })
      dispatch({
        type: evt.DISPLAY_TRIP_COUNT,
        payload: trips.length
      })

      const buckets = getStationStatusBuckets(trips, stationStatuses, start, end)

      dispatch({
        type: evt.SET_STATION_STATUS_BUCKETS,
        payload: buckets
      })

      fetchAllDirections(trips, start).then(directions => {
        dispatch({
          type: evt.GOT_ALL_TRIP_POINTS,
          payload: directions
        })
      })
      closeLoader(dispatch)
    })
      .catch(err => {
        console.log(err)
        closeLoader(dispatch)
      })
  }
}

function setAnimationTime (animationTime) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_ANIMATION_TIME,
      payload: animationTime
    })
  }
}

function setAnimationStartTime (startTime) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_ANIMATION_START_TIME,
      payload: startTime
    })
  }
}

function onChangeViewport (newViewport) {
  return (dispatch) => {
    dispatch({
      type: evt.CHANGE_VIEWPORT,
      payload: newViewport
    })
    dispatch({
      type: evt.CLICKED_POPUP,
      payload: false
    })
  }
}

function onStationClick (info, previousStationIndex, popupOpen) {
  return (dispatch) => {
    if (info.object && info.pixel) {
      dispatch({
        type: evt.CLICKED_POPUP,
        payload: (info.index !== previousStationIndex) || !popupOpen
      })
      dispatch({
        type: evt.SELECTED_STATION,
        payload: info.index
      })
      dispatch({
        type: evt.SHOW_STATION_INFO,
        payload: Object.assign(
          {},
          info.object,
          { 'pixel': info.pixel }
        )
      })
    }
  }
}

function updateStationStatuses(newTime, oldBucket) {
  return (dispatch) => {
    let timeInMs = newTime * COMPRESSION_FACTOR
    // update the stations in 90 second increments
    let newBucket = Math.floor(timeInMs / 90000) * 90000
    if (oldBucket !== newBucket) {
      dispatch({
        type: evt.UPDATE_BUCKET,
        payload: newBucket
      })
    }
  }
}

function startLoader (dispatch) {
  dispatch({
    type: evt.LOADING
  })
}

function closeLoader (dispatch) {
  dispatch({
    type: evt.DONE_LOADING
  })
}

function setAnimationFrame (animationFrame) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_ANIMATION_FRAME,
      payload: animationFrame
    })
  }
}

function setPauseTime (pauseTime) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_PAUSE,
      payload: pauseTime
    })
  }
}

function startOrStopAnimation (start = true) {
  return (dispatch) => {
    if (start) {
      dispatch({
        type: evt.START_ANIMATION
      })
    } else {
      dispatch({
        type: evt.PAUSE_ANIMATION
      })
    }
  }
}

// Map viewport

function getInitialViewport () {
  return {
    longitude: -71.100,
    latitude: 42.3568,
    zoom: 12.5,
    pitch: 60,
    bearing: 0,
    isDragging: false
  }
}

// reducers

function viewport (state = getInitialViewport(), action) {
  switch (action.type) {
    case evt.CHANGE_VIEWPORT:
      return Object.assign({}, state, action.payload)
    case evt.WINDOW_RESIZED:
      return Object.assign({}, state, action.payload)
    default:
      return state
  }
}

// controls

function setTimeInterval (timeLabel, newTime) {
  return (dispatch) => {
    dispatch({
      type: evt.SET_TIME_RANGE,
      label: timeLabel,
      time: newTime
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

// reducers

// station reducers

function stations (state = {}, action) {
  switch (action.type) {
    case evt.STATIONS_LOADED:
      return action.payload
    default:
      return state
  }
}

function stationStatuses (state = {}, action) {
  switch (action.type) {
    case evt.FETCHED_STATION_STATUSES:
      return action.payload
    case evt.ADD_BIKE:
      let addState = Object.assign({}, state)
      let stationIdAdd = action.stationId
      let bikeIdAdd = action.bikeId
      addState[stationIdAdd][bikeIdAdd] = 1
      return addState
    case evt.REMOVE_BIKE:
      let removeState = Object.assign({}, state)
      let stationIdRemove = action.stationId
      let bikeIdRemove = action.bikeId
      delete removeState[stationIdRemove][bikeIdRemove]
      return removeState
    default:
      return state
  }
}

function stationStatusBuckets (state = {}, action) {
  switch (action.type) {
    case evt.SET_STATION_STATUS_BUCKETS:
      return action.payload
    default:
      return state
  }
}

function currentBucket (state = 0, action) {
  switch (action.type) {
    case evt.UPDATE_BUCKET:
      return action.payload
    default:
      return state
  }
}

function trips (state = [], action) {
  switch (action.type) {
    case evt.FETCHED_TRIPS_BETWEEN:
      return action.payload
    default:
      return state
  }
}

function tripPoints (state = [], action) {
  switch (action.type) {
    case evt.GOT_TRIP_POINTS:
      let newState = state.slice()
      newState.push(action.payload)
      return newState
    case evt.GOT_ALL_TRIP_POINTS:
      return action.payload
    default:
      return state
  }
}

function tripsTimeRange (state = {startTime: null, endTime: null}, action) {
  switch (action.type) {
    case evt.SET_TIME_RANGE:
      return {...state, ...{[action.label]: action.time}}
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

// track state of the popup, including index of the last selected station

function previousStationIndex (state = null, action) {
  switch (action.type) {
    case evt.SELECTED_STATION:
      return action.payload
    default:
      return state
  }
}

function popupOpen (state = false, action) {
  switch (action.type) {
    case evt.CLICKED_POPUP:
      return action.payload
    default:
      return state
  }
}

function stationInfoBox (state = null, action) {
  switch (action.type) {
    case evt.SHOW_STATION_INFO:
      return action.payload
    default:
      return state
  }
}

// time reducers

function animationTime (state = null, action) {
  switch (action.type) {
    case evt.SET_ANIMATION_TIME:
      return action.payload
    default:
      return state
  }
}

function animationStartTime (state = null, action) {
  switch (action.type) {
    case evt.SET_ANIMATION_START_TIME:
      return action.payload
    default:
      return state
  }
}

// animation frame (int id)

function animationFrame (state = null, action) {
  switch (action.type) {
    case evt.SET_ANIMATION_FRAME:
      return action.payload
    default:
      return state
  }
}

// keeps track of whether the last time the animation was paused
function lastPauseTime (state = 0, action) {
  switch (action.type) {
    case evt.SET_PAUSE:
      return action.payload
    default:
      return state
  }
}

function animationPaused (state = true, action) {
  switch (action.type) {
    case evt.PAUSE_ANIMATION:
      return true
    case evt.START_ANIMATION:
      return false
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

// export actions and reducers

export const actions = {
  fetchStations,
  onChangeViewport,
  onStationClick,
  fetchTripsBetween,
  fetchStationStatuses,
  updateStationStatuses,
  setAnimationTime,
  setAnimationStartTime,
  setAnimationFrame,
  setPauseTime,
  setTimeInterval,
  displayTripCount,
  reset,
  startOrStopAnimation
}

export default combineReducers({
  stations,
  viewport,
  stationInfoBox,
  stationStatuses,
  tripPoints,
  popupOpen,
  previousStationIndex,
  trips,
  loading,
  tripsTimeRange,
  animationTime,
  animationStartTime,
  animationFrame,
  lastPauseTime,
  stationStatusBuckets,
  currentBucket,
  tripCount,
  animationPaused
})
