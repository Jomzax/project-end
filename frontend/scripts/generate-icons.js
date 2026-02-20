import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// อ่านไฟล์ icon index ตรง ๆ
const iconsIndexPath = path.join(
  __dirname,
  "../node_modules/lucide-react/dist/esm/icons/index.js"
)

const fileContent = fs.readFileSync(iconsIndexPath, "utf-8")

// ดึงชื่อ icon จาก export
const iconNames = [...fileContent.matchAll(/export\s+\{\s+default\s+as\s+(\w+)/g)]
  .map(match => match[1])
  .sort()

const outputPath = path.join(__dirname, "../src/app/lib/icon-names.json")

fs.writeFileSync(outputPath, JSON.stringify(iconNames, null, 2))

console.log(`✅ Generated ${iconNames.length} icons`)
