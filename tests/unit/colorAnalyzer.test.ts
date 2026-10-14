import { countTopColors } from '../../src/image/analysis/colorAnalyzer'

type Rgb = [number, number, number]

function packPixels(rgbs: Rgb[], transparentTail = 0): Uint8ClampedArray {
  const px = new Uint8ClampedArray((rgbs.length + transparentTail) * 4)
  rgbs.forEach(([r, g, b], i) => {
    px[i * 4] = r
    px[i * 4 + 1] = g
    px[i * 4 + 2] = b
    px[i * 4 + 3] = 255
  })
  return px
}

describe('countTopColors（颜色桶量化纯逻辑）', () => {
  it('按占比排序主色并排除透明像素', () => {
    const rgbs: Rgb[] = [
      ...Array.from({ length: 4 }, () => [255, 0, 0] as Rgb),
      ...Array.from({ length: 2 }, () => [0, 0, 255] as Rgb),
      [0, 255, 0],
    ]
    const px = packPixels(rgbs, 1) // 尾部 1 个全透明像素，应被排除
    const top = countTopColors(px, 3)

    expect(top).toHaveLength(3)
    expect(top[0].hex).toBe('#ff0000')
    expect(top[0].proportion).toBeCloseTo(4 / 7)
    expect(top[1].hex).toBe('#0000ff')
    expect(top[1].proportion).toBeCloseTo(2 / 7)
    expect(top[2].hex).toBe('#00ff00')
    expect(top[2].proportion).toBeCloseTo(1 / 7)
  })

  it('全部透明时返回空数组', () => {
    const px = new Uint8ClampedArray(16) // alpha 全 0
    expect(countTopColors(px)).toEqual([])
  })

  it('相近颜色归入同一量化桶', () => {
    const rgbs: Rgb[] = [
      [255, 12, 4],
      [255, 8, 8],
      [10, 250, 10],
    ]
    const top = countTopColors(packPixels(rgbs), 5)
    expect(top).toHaveLength(2) // 两个红色像素同处 r=15,g=0,b=0 桶
    expect(top[0].hex).toBe('#ff0a06') // 桶内取平均
    expect(top[0].proportion).toBeCloseTo(2 / 3)
    expect(top[1].hex).toBe('#0afa0a')
  })
})
