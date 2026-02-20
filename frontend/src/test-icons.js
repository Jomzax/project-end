// Test file to verify icon loading from lucide-react
import * as LucideIcons from "lucide-react"

const allIconNames = Object.keys(LucideIcons).filter(key => {
    if (!/^[A-Z]/.test(key)) return false
    if (typeof LucideIcons[key] !== 'function') return false
    if (key === 'default' || key === 'Fragment' || key === 'Suspense') return false
    return true
})

console.log('=== LUCIDE REACT ICON TEST ===')
console.log(`Total icons found: ${allIconNames.length}`)
console.log(`First 20 icons: ${allIconNames.slice(0, 20).join(', ')}`)
console.log(`Last 20 icons: ${allIconNames.slice(-20).join(', ')}`)

// Test search
const searchTerm = 'heart'
const filtered = allIconNames.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()))
console.log(`\nSearch for "${searchTerm}": ${filtered.length} results`)
console.log(`Results: ${filtered.join(', ')}`)
