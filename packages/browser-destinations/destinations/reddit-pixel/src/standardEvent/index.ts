// import type { ActionDefinition } from '@segment/actions-core'

import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { 
  tracking_type,
  conversion_id,
  event_metadata,
  user,
 } from '../fields'
import { RedditPixel } from '../types'

const action: BrowserActionDefinition<Settings, RedditPixel, Payload> = {
  title: 'Standard Event',
  description: '',
  platform: 'web',
  defaultSubscription: 'type = "track"',
  fields: {
    tracking_type,
    conversion_id,
    event_metadata,
    user
  },
  perform: (rdt, { payload }) => {
    rdt.track = 'track'
    console.log('tracking type', payload.tracking_type)
    console.log('rdt.track', rdt.track)
    

    rdt(rdt.track, payload.tracking_type)

  }
}

export default action
