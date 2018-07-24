import moment from 'moment/moment'
import { COLOR_MAPPING, COMPRESSION_FACTOR } from './constants'

export function formatTime (start, time) {
  let timeInMs = moment(start + (time * COMPRESSION_FACTOR))
  return timeInMs.format('ddd MMMM D, HH:mm:ss')
}

export const fetchAllDirections = async (trips, overallStartTime) => {
  let tripsGroupedBySS = {}
  let startStationIds = []
  let endStationIds = []
  trips.forEach(trip => {
    if (!(trip['ss_id'] in tripsGroupedBySS)) {
      tripsGroupedBySS[trip['ss_id']] = {}
      startStationIds.push(trip['ss_id'])
    }
    if (!(trip['es_id'] in tripsGroupedBySS[trip['ss_id']])) {
      tripsGroupedBySS[trip['ss_id']][trip['es_id']] = trip
      endStationIds.push(trip['es_id'])
    }
  })
  return fetch('/directions/all', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'trips': trips,
      'startStationIds': startStationIds,
      'endStationIds': endStationIds
    })
  }).then(res => {
    return res.json()
  }).then(tripList => {
    let labeledTrips = []
    tripList.forEach(trip => {
      if (trip && trip['segments'].length > 1) {
        let segments = trip['segments'].map(p => { return [p[1], p[0]] })
        let timeFromStart = trip['starttime'] - overallStartTime     // ms
        let speed = trip['distance'] / (trip['tripduration'] * 1000) // meters/ms
        let updatedSegments = addInterpolatedTimestamp(segments, timeFromStart, speed)
        if (updatedSegments.length > 1) {
          labeledTrips.push({
            'tripId': trip['id'],
            'segments': updatedSegments,
            'color': (trip['usertype'] === 'Subscriber') ? [153, 255, 255] : [255, 128, 255]
          })
        }
      }
    })
    return labeledTrips
  })
}

export function getStationStatusBuckets (trips, stationStatuses, startTime, endTime) {
  let sortedTrips = sortObjectsByField(trips, 'stoptime')
  let buckets = {}
  let stationStatusesSimple = {}

  // only keep track of number of bikes at each station
  Object.keys(stationStatuses).map(stationId => {
    stationStatusesSimple[stationId] = Object.keys(stationStatuses[stationId]).length
  })
  buckets[0] = {...stationStatusesSimple}

  let tripCounter = 0
  let currentBucket = 90000  // milliseconds
  while (currentBucket < (endTime - startTime)) {
    while (tripCounter < sortedTrips.length && (sortedTrips[tripCounter]['stoptime'] - startTime) < currentBucket) {
      let ssId = sortedTrips[tripCounter]['ss_id']
      let esId = sortedTrips[tripCounter]['es_id']
      stationStatusesSimple[ssId] -= 1
      stationStatusesSimple[esId] += 1
      tripCounter += 1
    }
    buckets[currentBucket] = Object.assign({}, stationStatusesSimple)
    currentBucket += 90000
  }

  return buckets
}

/**
 * Convert datetime string to epoch milliseconds
 */
export function formatTripTimestamps (trips) {
  return trips.map(trip => {
    let formattedTrip = Object.assign({}, trip)
    formattedTrip['starttime'] = moment(trip['starttime'], 'YYYY-MM-DD HH:mm:ss.SSSZ').valueOf()
    formattedTrip['stoptime'] = moment(trip['stoptime'], 'YYYY-MM-DD HH:mm:ss.SSSZ').valueOf()
    return formattedTrip
  })
}

export function sortObjectsByField (list, fieldName) {
  return list.slice().sort((a, b) => {
    if (a[fieldName] < b[fieldName]) return -1
    if (a[fieldName] > b[fieldName]) return 1
    else return 0
  })
}

/***
 * Helper function to return day of year (1-366) given UTC timestamp
 * @param start
 * @returns {number}
 */
export function getDayOfYear (start) {
  let startDate = new Date(start)
  let startOfYear = new Date(startDate.getFullYear(), 0, 0)
  let diff = startDate - startOfYear
  let oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}

/**
 * Haversine formula to get distance between 2 lat, lng points in meters
 * Copied from https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
 */
export function getDistanceInMeters(lat1,lon1,lat2,lon2) {
  let R = 6371 // Radius of the earth in km
  let dLat = deg2rad(lat2-lat1);  // deg2rad below
  let dLon = deg2rad(lon2-lon1);
  let a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let d = R * c // Distance in km
  return d * 1000
}

export function deg2rad(deg) {
  return deg * (Math.PI/180)
}

/**
 *
 * @param segments
 * @param timeFromStart: in milliseconds
 * @param speed: in meters/ms
 */
export function addInterpolatedTimestamp (segments, timeFromStart, speed) {
  let currTime = timeFromStart / COMPRESSION_FACTOR
  return segments.map((point, i) => {
    let prevPoint = (i > 0) ? segments[i-1] : segments[i]
    let dist = getDistanceInMeters(point[0], point[1], prevPoint[0], prevPoint[1])
    currTime += (dist / speed) / COMPRESSION_FACTOR
    point.push(currTime)
    return point
  })
}

// map helpers

export function formatStationLayer (stations, stationStatusBucket) {
  return Object.keys(stations).map(stationId => {
    let station = stations[stationId]
    let currBikeCount, occupancyRatio = -1
    let capacity = station['capacity'] ? station['capacity'] : 1
    let stationColor = [26, 178, 255]
    if (stationStatusBucket && Object.keys(stationStatusBucket).length > 0) {
      currBikeCount = Math.min(
        stationStatusBucket[stationId],
        capacity
      )
      occupancyRatio = currBikeCount / capacity
      if (occupancyRatio > 0.9) {
        stationColor = COLOR_MAPPING.full
      } else if (occupancyRatio > 0.5) {
        stationColor = COLOR_MAPPING.fullish
      } else if (occupancyRatio > 0.1) {
        stationColor = COLOR_MAPPING.emptyish
      } else if (occupancyRatio <= 0.1) {
        stationColor = COLOR_MAPPING.empty
      }
    }
    return Object.assign(
      {},
      station,
      {
        'currBikeCount': currBikeCount,
        'color': stationColor,
        'position': [station['lon'], station['lat']],
        'index': stationId,
        'icon': 'bikeMarker',
        'size': 40
      }
    )
  })
}

export function getIconScale (zoom) {
  const defaultScale = 1
  if (zoom < 11.3) {
    return defaultScale * 0.5
  } else if (zoom < 11.5) {
    return defaultScale * 0.8
  } else if (zoom < 13) {
    return defaultScale
  } else if (zoom < 14.5) {
    return defaultScale * 1.5
  } else if (zoom < 16) {
    return defaultScale * 2
  } else {
    return defaultScale * 3
  }
}
