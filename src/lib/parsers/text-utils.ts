export function countAlphanumeric(text: string): number {
  let n = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    // 0-9
    if (code >= 48 && code <= 57) n++
    // A-Z
    else if (code >= 65 && code <= 90) n++
    // a-z
    else if (code >= 97 && code <= 122) n++
    // Acentos castellanos comunes (á é í ó ú ñ ü y mayúsculas)
    else if (
      code === 225 ||
      code === 233 ||
      code === 237 ||
      code === 243 ||
      code === 250 ||
      code === 241 ||
      code === 252 ||
      code === 193 ||
      code === 201 ||
      code === 205 ||
      code === 211 ||
      code === 218 ||
      code === 209 ||
      code === 220
    )
      n++
  }
  return n
}
