/**
 * Sprint 0：测试样例集生成脚本
 * 用 Node 内置 zlib 生成最小合法 PNG（RGBA），不引入任何图像库依赖。
 * 所有样例均为程序自绘 → 许可证 CC0，可放心提交仓库。
 *
 * 运行：npm run fixtures
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../tests/fixtures')
mkdirSync(outDir, { recursive: true })

// ---------- PNG 编码 ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

/** pixelFn(x, y) => [r, g, b, a] */
function encodePng(width, height, pixelFn) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
      raw[p++] = a
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function save(name, width, height, pixelFn) {
  const png = encodePng(width, height, pixelFn)
  writeFileSync(join(outDir, name), png)
  console.log(`  ${name}: ${width}x${height}, ${(png.length / 1024).toFixed(1)} KB`)
}

// ---------- 可复现伪随机（噪声图用） ----------

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- 六类样例 ----------

console.log('生成测试样例集 → tests/fixtures/')

// 1. 单色图：纯红，验证主色提取收敛到单一色
save('solid-red-256.png', 256, 256, () => [220, 38, 38, 255])

// 2. 渐变图：靛蓝→粉，验证渐变场景下主色聚类的稳定性
save('gradient-256.png', 256, 256, (x) => {
  const t = x / 255
  return [
    Math.round(99 + t * (236 - 99)),
    Math.round(102 + t * (72 - 102)),
    Math.round(241 + t * (153 - 241)),
    255,
  ]
})

// 3. 透明 PNG：靛蓝圆盘（中心圆不透明，其余全透明），验证 alpha 过滤
save('alpha-disc-128.png', 128, 128, (x, y) => {
  const inside = (x - 64) ** 2 + (y - 64) ** 2 <= 50 ** 2
  return inside ? [79, 70, 229, 255] : [0, 0, 0, 0]
})

// 4. 极小图：2x2 四色（含 1 个透明像素），验证边界条件
save('tiny-2x2.png', 2, 2, (x, y) => {
  if (x === 0 && y === 0) return [255, 0, 0, 255]
  if (x === 1 && y === 0) return [0, 255, 0, 255]
  if (x === 0 && y === 1) return [0, 0, 255, 255]
  return [255, 255, 0, 0] // 透明
})

// 5. 高噪声图：seed=42 灰度噪声，验证高熵图的桶量化性能与结果可复现
const rand = mulberry32(42)
save('noise-256.png', 256, 256, () => {
  const v = Math.round(rand() * 255)
  return [v, v, v, 255]
})

// 6. 人脸占位图：程序绘制的简笔笑脸。
//    ⚠ 注意：这是手动框选/坐标换算测试用的几何占位，不是真实人脸，
//    不能用于 MediaPipe 检测模型的功能验证。
//    接入真实人脸检测前，需补充 1 张许可证明确的人脸照片（记录来源与许可）。
save('face-placeholder-256.png', 256, 256, (x, y) => {
  const eye = (cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
  if (eye(96, 100, 13) || eye(160, 100, 13)) return [17, 24, 39, 255] // 眼睛
  const d = Math.sqrt((x - 128) ** 2 + (y - 138) ** 2)
  if (d >= 44 && d <= 54 && y >= 138) return [17, 24, 39, 255] // 嘴巴
  return [253, 230, 138, 255] // 背景
})

console.log('完成。全部样例为程序自绘（CC0）。')
