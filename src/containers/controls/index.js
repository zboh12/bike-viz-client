import React from 'react'
import { Button, Loader, Label } from 'semantic-ui-react'
import { formatTime } from '../../helpers/helperFunctions'

import moment from 'moment'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'react-datepicker/dist/react-datepicker-cssmodules.css'

require('./controls.css')

const Controls = (props) => {
  return !props.loading ? (<div className='control-panel'>
    <Label size='huge' className='time-label'>
      {props.animationTime ?
        formatTime(props.tripsTimeRange.startTime, props.animationTime) : '00:00'}
    </Label>
    <DatePicker
      selectsStart
      placeholderText='Start Time'
      showMonthDropdown
      minDate={moment('1-1-2017', 'MM-DD-YYYY')}
      maxDate={moment('12-31-2017', 'MM-DD-YYYY')}
      selected={props.tripsTimeRange.startTime ? moment(props.tripsTimeRange.startTime) : null}
      startDate={props.tripsTimeRange.startTime ? moment(props.tripsTimeRange.startTime) : null}
      endDate={props.tripsTimeRange.endTime ? moment(props.tripsTimeRange.endTime) : null}
      onChange={(m) => {
        props.setTimeInterval('startTime', m.valueOf())
      }}
    />
    <DatePicker
      selectsEnd
      placeholderText='End Time'
      showMonthDropdown
      minDate={props.tripsTimeRange.startTime ? moment(props.tripsTimeRange.startTime) : moment('1-1-2017', 'MM-DD-YYYY')}
      maxDate={moment('12-31-2017', 'MM-DD-YYYY')}
      selected={props.tripsTimeRange.endTime ? moment(props.tripsTimeRange.endTime) : null}
      startDate={props.tripsTimeRange.startTime ? moment(props.tripsTimeRange.startTime) : null}
      endDate={props.tripsTimeRange.endTime ? moment(props.tripsTimeRange.endTime) : null}
      onChange={(m) => {
        props.setTimeInterval('endTime', m.valueOf())
      }}
    />
    <Button
      onClick={() => {
        props.fetchStationStatuses(props.tripsTimeRange.startTime, (stationStatuses) => {
          props.fetchTripsBetween(stationStatuses, props.tripsTimeRange)
        })
      }}
    >
      Get Trips
    </Button>
    <Button
      onClick={() => props.reset()}
    >
      Reset
    </Button>
    {props.tripCount > 0 ? (<Label>  {props.tripCount + ' trips retrieved'} </Label>) : null }
    <div>
      {props.controlTime ? (<Label size='medium'>
        {formatTime(props.startTimestamp, props.controlTime)}
      </Label>) : null}
    </div>
  </div>) : <Loader active />
}

export default Controls