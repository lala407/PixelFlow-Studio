import { render, screen } from '@testing-library/react'

describe('测试环境', () => {
  it('jsdom + Testing Library 可用', () => {
    render(<div>PixelFlow Studio</div>)
    expect(screen.getByText('PixelFlow Studio')).toBeInTheDocument()
  })
})
