import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { COMPRESSION_FACTOR } from '../../helpers/constants'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

const TimeSlider = (props) => {
  const days = Math.ceil((props.tripsTimeRange.endTime - props.tripsTimeRange.startTime) / 86400000)
  return props.tripCount ? <div className='sliderContainer'>
    <Slider
      min={0}
      max={(86400000 / COMPRESSION_FACTOR) * days}
      value={props.animationTime || 0}
      onChange={(newTime) => {
        let pauseInterval =  props.animationTime
        if (props.lastPauseTime) {
          pauseInterval -= props.lastPauseTime
        }
        props.setPauseTime(newTime - pauseInterval)
      }}
    />
    <Button
      icon
      style={{display: (props.animationPaused ? 'block' : 'none')}}
      onClick={() => {
        const startTime = Date.now()
        props.setAnimationStartTime(startTime)
        props.startAnimation()
      }}
    >
      <Icon name='play' />
    </Button>
    <Button
      icon
      style={{display: (!props.animationPaused ? 'block' : 'none')}}
      onClick={() => {
        props.setPauseTime(props.animationTime)
        // stop animation
        window.cancelAnimationFrame(props.animationFrame)
        props.startOrStopAnimation(false)
      }}
    >
      <Icon name='pause' />
    </Button>
  </div> : null
}

export default TimeSlider
