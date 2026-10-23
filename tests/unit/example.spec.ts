import { mount } from '@vue/test-utils'
import LandingPage from '@/views/landing/LandingClean.vue'
import { describe, expect, test } from 'vitest'

describe('LandingClean.vue', () => {
  test('renders the landing page brand and hero', () => {
    const wrapper = mount(LandingPage)
    expect(wrapper.text()).toContain('FIXHUB')
    expect(wrapper.text()).toContain('Your Device.')
  })
})
