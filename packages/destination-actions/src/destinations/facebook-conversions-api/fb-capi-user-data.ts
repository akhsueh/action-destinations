import { InputField } from '@segment/actions-core/destination-kit/types'
import { US_STATE_CODES, COUNTRY_CODES } from './constants'
import { Payload } from './addToCart/generated-types'
import isEmpty from 'lodash/isEmpty'
import { processHashingV2 } from '../../lib/hashing-utils'

// Implementation of Facebook user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
export const user_data_field: InputField = {
  label: 'User Data',
  description:
    'These parameters are a set of identifiers Facebook can use for targeted attribution. You must provide at least one of the following parameters in your request. More information on recommended User Data parameters in Facebook’s [Best Practices for Conversions API](https://www.facebook.com/business/help/308855623839366).',
  type: 'object',
  required: true,
  properties: {
    externalId: {
      label: 'External ID',
      description:
        'Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.',
      type: 'string',
      multiple: true, // changed the type from string to array of strings.
      category: 'hashedPII'
    },
    email: {
      label: 'Email',
      description: 'An email address in lowercase.',
      type: 'string',
      category: 'hashedPII'
    },
    phone: {
      label: 'Phone',
      description:
        'A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code, even if all of the data is from the same country, as the country code is used for matching.',
      type: 'string',
      category: 'hashedPII'
    },
    gender: {
      label: 'Gender',
      description: 'Gender in lowercase. Either f or m.',
      type: 'string',
      category: 'hashedPII'
    },
    dateOfBirth: {
      label: 'Date of Birth',
      description: 'A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.',
      type: 'string',
      category: 'hashedPII'
    },
    lastName: {
      label: 'Last Name',
      description: 'A last name in lowercase.',
      type: 'string',
      category: 'hashedPII'
    },
    firstName: {
      label: 'First Name',
      description: 'A first name in lowercase.',
      type: 'string',
      category: 'hashedPII'
    },
    city: {
      label: 'City',
      description: 'A city in lowercase without spaces or punctuation. Example: menlopark.',
      type: 'string',
      category: 'hashedPII'
    },
    state: {
      label: 'State',
      description: 'A two-letter state code in lowercase. Example: ca.',
      type: 'string',
      category: 'hashedPII'
    },
    zip: {
      label: 'Zip Code',
      description: 'A five-digit zip code for United States. For other locations, follow each country`s standards.',
      type: 'string',
      category: 'hashedPII'
    },
    country: {
      label: 'Country',
      description: 'A two-letter country code in lowercase.',
      type: 'string',
      category: 'hashedPII'
    },
    client_ip_address: {
      label: 'Client IP Address',
      description: 'The IP address of the browser corresponding to the event.',
      type: 'string'
    },
    client_user_agent: {
      label: 'Client User Agent',
      description:
        'The user agent for the browser corresponding to the event. This is required if action source is “website”.',
      type: 'string'
    },
    fbc: {
      label: 'Click ID',
      description: 'The Facebook click ID value stored in the _fbc browser cookie under your domain.',
      type: 'string'
    },
    fbp: {
      label: 'Browser ID',
      description: 'The Facebook browser ID value stored in the _fbp browser cookie under your domain.',
      type: 'string'
    },
    subscriptionID: {
      label: 'Subscription ID',
      description: 'The subscription ID for the user in this transaction.',
      type: 'string'
    },
    leadID: {
      label: 'Lead ID',
      description: 'The ID associated with a lead generated by Facebook`s Lead Ads.',
      type: 'integer'
    },
    fbLoginID: {
      label: 'Facebook Login ID',
      description: 'The ID issued by Facebook when a person first logs into an instance of an app.',
      type: 'integer'
    },
    anonId: {
      label: 'Install ID (anon_id)',
      description:
        'This field represents unique application installation instances. Note: This parameter is for app events only.',
      type: 'string'
    },
    madId: {
      label: 'Advertiser ID (madid)',
      description:
        'Your mobile advertiser ID, the advertising ID from an Android device or the Advertising Identifier (IDFA) from an Apple device.',
      type: 'string'
    },
    partner_id: {
      label: 'Partner ID',
      description: 'The ID issued by Facebook identity partner.',
      type: 'string'
    },
    partner_name: {
      label: 'Partner Name',
      description: 'The name of the Facebook identity partner.',
      type: 'string'
    }
  },
  default: {
    externalId: {
      '@if': {
        exists: { '@path': '$.userId' },
        then: { '@path': '$.userId' },
        else: { '@path': '$.anonymousId' }
      }
    },
    email: {
      '@path': '$.context.traits.email'
    },
    phone: {
      '@path': '$.context.traits.phone'
    },
    dateOfBirth: {
      '@path': '$.context.traits.birthday'
    },
    lastName: {
      '@path': '$.context.traits.lastName'
    },
    firstName: {
      '@path': '$.context.traits.firstName'
    },
    city: {
      '@path': '$.context.traits.address.city'
    },
    state: {
      '@path': '$.context.traits.address.state'
    },
    zip: {
      '@path': '$.context.traits.address.postalCode'
    },
    client_ip_address: {
      '@path': '$.context.ip'
    },
    client_user_agent: {
      '@path': '$.context.userAgent'
    },
    fbc: {
      '@path': '$.properties.fbc'
    },
    fbp: {
      '@path': '$.properties.fbp'
    }
  }
}

type UserData = Pick<Payload, 'user_data'>

const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)

const hash = (value: string | string[] | undefined): string | string[] | undefined => {
  if (value === undefined || !value.length) return

  if (typeof value == 'string') {
    return processHashingV2(value, 'sha256', 'hex')
  }

  return value.map((el: string) => processHashingV2(el, 'sha256', 'hex'))
}

/**
 * Normalization of user data properties according to Facebooks specifications.
 * @param payload
 * @see https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences#hash
 */
export const normalize_user_data = (payload: UserData) => {
  if (payload.user_data.email) {
    // Regex removes all whitespace in the string.
    payload.user_data.email = payload.user_data.email.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.phone && !isHashedInformation(payload.user_data.phone)) {
    // Regex removes all non-numeric characters from the string.
    payload.user_data.phone = payload.user_data.phone.replace(/\D/g, '')
  }

  if (payload.user_data.gender) {
    payload.user_data.gender = payload.user_data.gender.replace(/\s/g, '').toLowerCase()
    switch (payload.user_data.gender) {
      case 'male':
        payload.user_data.gender = 'm'
        break
      case 'female':
        payload.user_data.gender = 'f'
        break
    }
  }

  if (payload.user_data.lastName) {
    payload.user_data.lastName = payload.user_data.lastName.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.firstName) {
    payload.user_data.firstName = payload.user_data.firstName.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.city) {
    payload.user_data.city = payload.user_data.city.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.state) {
    payload.user_data.state = payload.user_data.state.replace(/\s/g, '').toLowerCase()

    if (US_STATE_CODES.has(payload.user_data.state)) {
      payload.user_data.state = US_STATE_CODES.get(payload.user_data.state)
    }
  }

  if (payload.user_data.zip) {
    payload.user_data.zip = payload.user_data.zip.replace(/\s/g, '').toLowerCase()
  }

  if (payload.user_data.country) {
    payload.user_data.country = payload.user_data.country.replace(/\s/g, '').toLowerCase()

    if (COUNTRY_CODES.has(payload.user_data.country)) {
      payload.user_data.country = COUNTRY_CODES.get(payload.user_data.country)
    }
  }

  if (!isEmpty(payload.user_data?.externalId)) {
    // TO handle the backward compatibility where externalId can be string
    if (typeof payload.user_data?.externalId === 'string') {
      payload.user_data.externalId = [payload.user_data?.externalId]
    }
    payload.user_data.externalId = payload.user_data.externalId?.map((el: string) =>
      el.replace(/\s/g, '').toLowerCase()
    )
  }
}

export const hash_user_data = (payload: UserData): Object => {
  normalize_user_data(payload)
  // Hashing this is recommended but not required
  return {
    em: hash(payload.user_data?.email),
    ph: hash(payload.user_data?.phone),
    ge: hash(payload.user_data?.gender),
    db: hash(payload.user_data?.dateOfBirth),
    ln: hash(payload.user_data?.lastName),
    fn: hash(payload.user_data?.firstName),
    ct: hash(payload.user_data?.city),
    st: hash(payload.user_data?.state),
    zp: hash(payload.user_data?.zip),
    country: hash(payload.user_data?.country),
    external_id: hash(payload.user_data?.externalId), //to provide support for externalId as string and array both
    client_ip_address: payload.user_data?.client_ip_address,
    client_user_agent: payload.user_data?.client_user_agent,
    fbc: payload.user_data?.fbc,
    fbp: payload.user_data?.fbp,
    subscription_id: payload.user_data?.subscriptionID,
    lead_id: payload.user_data?.leadID,
    anon_id: payload.user_data?.anonId,
    madid: payload.user_data?.madId,
    fb_login_id: payload.user_data?.fbLoginID,
    partner_id: payload.user_data?.partner_id,
    partner_name: payload.user_data?.partner_name
  }
}
