import { AttributeMap, ProductAttribute, VariantAttribute } from '@/types/product'

/**
 * Get attribute value from a list of attributes by key
 */
export function getAttribute(
  attributes: { key: string; value: string }[],
  key: string
): string | undefined {
  return attributes.find(attr => attr.key === key)?.value
}

/**
 * Get all attribute values from a list of attributes by key
 * Useful when multiple attributes might have the same key
 */
export function getAttributes(
  attributes: { key: string; value: string }[],
  key: string
): string[] {
  return attributes.filter(attr => attr.key === key).map(attr => attr.value)
}

/**
 * Convert attributes array to a key-value map
 */
export function attributesToMap(
  attributes: { key: string; value: string }[]
): AttributeMap {
  return attributes.reduce((map, attr) => {
    map[attr.key] = attr.value
    return map
  }, {} as AttributeMap)
}

/**
 * Convert a key-value map to attributes array
 */
export function mapToAttributes(
  map: AttributeMap
): { key: string; value: string }[] {
  return Object.entries(map).map(([key, value]) => ({ key, value }))
}

/**
 * Get all unique attribute keys from variants
 */
export function getVariantAttributeKeys(
  variants: { attributes: { key: string; value: string }[] }[]
): string[] {
  const keys = new Set<string>()
  variants.forEach(variant => {
    variant.attributes.forEach(attr => {
      keys.add(attr.key)
    })
  })
  return Array.from(keys).sort()
}

/**
 * Get all unique attribute keys from products
 */
export function getProductAttributeKeys(
  products: { attributes: { key: string; value: string }[] }[]
): string[] {
  const keys = new Set<string>()
  products.forEach(product => {
    product.attributes.forEach(attr => {
      keys.add(attr.key)
    })
  })
  return Array.from(keys).sort()
}

/**
 * Generate SKU from product name and variant attributes
 * Example: "Nike Air Max 90" + {size: "9", color: "White"} => "nike-air-max-90-9-white"
 */
export function generateSKU(
  productName: string,
  attributes: { key: string; value: string }[]
): string {
  // Slugify product name
  const productSlug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Sort attributes by key for consistency
  const sortedAttributes = [...attributes].sort((a, b) => a.key.localeCompare(b.key))

  // Append attribute values
  const attributesSuffix = sortedAttributes
    .map(attr => attr.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .join('-')

  return attributesSuffix ? `${productSlug}-${attributesSuffix}` : productSlug
}

/**
 * Format attribute key for display
 * Example: "screen_size" => "Screen Size"
 */
export function formatAttributeKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get variant display name from attributes
 * Example: {size: "9", color: "White"} => "Size 9, White"
 */
export function getVariantDisplayName(
  attributes: { key: string; value: string }[]
): string {
  if (attributes.length === 0) return 'Default'

  // Prioritize common attributes like size, color, storage
  const priorityKeys = ['size', 'color', 'storage', 'memory', 'format', 'condition']

  // Get priority attributes first, then others
  const priorityAttrs = attributes.filter(attr => priorityKeys.includes(attr.key))
  const otherAttrs = attributes.filter(attr => !priorityKeys.includes(attr.key))

  const orderedAttrs = [...priorityAttrs, ...otherAttrs]

  return orderedAttrs
    .map((attr, index) => {
      // For the first attribute, include the key name
      if (index === 0) {
        return `${formatAttributeKey(attr.key)} ${attr.value}`
      }
      // For subsequent attributes, just show the value
      return attr.value
    })
    .join(', ')
}

/**
 * Validate SKU format
 */
export function isValidSKU(sku: string): boolean {
  // SKU should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with hyphen
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(sku)
}

/**
 * Get all unique values for a specific attribute key across variants
 */
export function getUniqueAttributeValues(
  variants: { attributes: { key: string; value: string }[] }[],
  key: string
): string[] {
  const values = new Set<string>()
  variants.forEach(variant => {
    const value = getAttribute(variant.attributes, key)
    if (value) {
      values.add(value)
    }
  })
  return Array.from(values).sort()
}

/**
 * Filter variants by attribute
 */
export function filterVariantsByAttribute(
  variants: { attributes: { key: string; value: string }[] }[],
  key: string,
  value: string
): typeof variants {
  return variants.filter(variant => {
    const attrValue = getAttribute(variant.attributes, key)
    return attrValue === value
  })
}

/**
 * Check if two attribute sets are equal
 */
export function areAttributesEqual(
  attrs1: { key: string; value: string }[],
  attrs2: { key: string; value: string }[]
): boolean {
  if (attrs1.length !== attrs2.length) return false

  const map1 = attributesToMap(attrs1)
  const map2 = attributesToMap(attrs2)

  return Object.keys(map1).every(key => map1[key] === map2[key])
}

/**
 * Merge attributes, with new attributes overriding existing ones
 */
export function mergeAttributes(
  existing: { key: string; value: string }[],
  updates: { key: string; value: string }[]
): { key: string; value: string }[] {
  const map = attributesToMap(existing)

  updates.forEach(update => {
    map[update.key] = update.value
  })

  return mapToAttributes(map)
}
