const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const tabDir = path.resolve(__dirname, '../src/assets/tab')
const files = fs.readdirSync(tabDir).filter((f) => f.endsWith('.svg'))

;(async () => {
  for (const file of files) {
    const input = path.join(tabDir, file)
    const output = path.join(tabDir, file.replace('.svg', '.png'))
    await sharp(input)
      .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(output)
    console.log(`✓ ${file} -> ${path.basename(output)}`)
  }
})()
