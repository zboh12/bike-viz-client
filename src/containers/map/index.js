import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import DeckGL, { IconLayer } from 'deck.gl'
import MapGL from 'react-map-gl'
import TripsLayer from './trips-layer'  // custom trips layer
import { actions } from '../../modules/map'
import { Loader } from 'semantic-ui-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import Controls from '../controls'
import TimeSlider from '../slider'
import { MAPBOX_TOKEN, ICON_MAPPING, COMPRESSION_FACTOR } from '../../helpers/constants'
import { formatStationLayer, getIconScale } from '../../helpers/helperFunctions'

require('./map.css')

function renderPopup (station, popupOpen) {
  if (station && !popupOpen) {
    return (
      <div
        className='tooltip'
        style={{
          position: 'absolute',
          top: station.pixel[1],
          left: station.pixel[0] + 5
        }}
      >
        {station.name + ((station.currBikeCount != null) ? ' (' + station.currBikeCount + '/' + station.capacity + ')' : '')}
      </div>
    )
  }
}

class Map extends React.Component {
  constructor(props) {
    super(props)
    // socket.on('fetchData', timeInterval => {
    //   this.props.startLoader()
    //   this.props.fetchStationStatuses(this.props.stations, timeInterval.start, () => {
    //     this.props.fetchTripsBetween(socket, this.props.stations, this.props.stationStatuses, timeInterval.start, timeInterval.end)
    //     this.props.closeLoader()
    //   })
    // })
    //
    // socket.on('startAnimation', (time) => {
    //   if (time) {
    //     this.props.setPauseTime(time)
    //     this.props.setMapTime(time)
    //     socket.emit('setTime', time)
    //   }
    //   const startTime = Date.now()
    //   this.props.setStartTime(startTime)
    //   socket.emit('setStartTime', startTime)
    //   this._animate()
    // })
    //
    // socket.on('stopAnimation', () => {
    //   window.cancelAnimationFrame(this.props.animationFrame)
    // })
    //
    // socket.on('setControlTime', (newTime) => {
    //   window.cancelAnimationFrame(this.props.animationFrame)
    //   this.props.setPauseTime(newTime)
    //   const startTime = Date.now()
    //   this.props.setStartTime(startTime)
    //   socket.emit('setStartTime', startTime)
    //   this.props.setMapTime(newTime)
    //   socket.emit('setTime', newTime)
    //   this._animate()
    // })
    //
    // socket.on('resetMap', () => {
    //   window.cancelAnimationFrame(this.props.animationFrame)
    //   this.props.reset()
    // })
  }
  componentDidMount() {
    if (!this.props.stations || Object.keys(this.props.stations).length === 0) {
      this.props.fetchStations()
    }
  }

  componentWillUnmount() {
    if (this.props.animationFrame) {
      window.cancelAnimationFrame(this.props.animationFrame)
    }
  }

  _animate() {
    const currentTime = Date.now() - this.props.animationStartTime  // milliseconds since the start of the animation
    const days = Math.ceil((this.props.tripsTimeRange.endTime - this.props.tripsTimeRange.startTime) / 86400000)
    const loopMax = (86400000 / COMPRESSION_FACTOR) * days
    let newTime = currentTime % loopMax

    if (this.props.lastPauseTime) {
      newTime += this.props.lastPauseTime
      if (newTime > loopMax) {
        newTime = newTime % loopMax
      }
    }

    this.props.setAnimationTime(newTime)

    // this.props.updateStationStatuses(newTime, this.props.currentBucket)

    this.props.setAnimationFrame(window.requestAnimationFrame(this._animate.bind(this)))
  }

  getStationLayer() {
    if (this.props.stations && Object.keys(this.props.stations).length > 0) {
      return [new IconLayer({
        id: 'scatterplot-layer',
        data: formatStationLayer(this.props.stations, this.props.stationStatusBuckets[this.props.currentBucket]),
        iconMapping: ICON_MAPPING,
        iconAtlas: process.env.PUBLIC_URL + '/map-icon.png',
        getPosition: d => d.position,
        getIcon: d => d.icon,
        sizeScale: getIconScale(this.props.viewport.zoom),
        opacity: 0.5,
        pickable: true,
        onClick: data => this.props.onStationClick(data, this.props.previousStationIndex, this.props.popupOpen)
      })]
    } else {
      return []
    }
  }

  getTripLayer() {
    if (this.props.tripPoints && this.props.tripPoints.length > 0) {
      return [
        new TripsLayer({
          id: 'trips',
          data: this.props.tripPoints,
          getPath: (d) => {
            return d.segments
          },
          opacity: 1,
          trailLength: 1000,
          strokeWidth: 2,  // this does nothing
          currentTime: this.props.animationTime
        })
      ]
    } else {
      return []
    }
  }

  render () {
    return !this.props.loading ? (<div>
      {(this.props.viewport)
        ? <MapGL
            {...this.props.viewport}
            onViewportChange={(viewport) => this.props.onChangeViewport(viewport)}
            mapboxApiAccessToken={MAPBOX_TOKEN}
            mapStyle='mapbox://styles/zboh12/cjftwqs4n62gw2sjwn05hapbm'
          >
            <Controls {...this.props} />

            {this.props.popupOpen ? renderPopup(this.props.stationInfoBox) : null}

            <DeckGL
              {...this.props.viewport}
              layers={this.getStationLayer().concat(this.getTripLayer())}
            />

            <TimeSlider
              {...this.props}
              startAnimation={
                () => {
                  this._animate()
                  this.props.startOrStopAnimation(true)
                }
              }
            />
          </MapGL> : null
      }
    </div>) : <Loader active />
  }
}

const mapStateToProps = state => {
  return state.mapRoute
}

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Map)
