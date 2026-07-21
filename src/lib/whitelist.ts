const KNOWN_BRANDS = [
  'samsung', 'apple', 'intel', 'amd', 'nvidia', 'lg', 'sony', 'dell', 'lenovo',
  'hp', 'acer', 'asus', 'msi', 'gigabyte', 'kingston', 'corsair', 'logitech',
  'jbl', 'motorola', 'xiaomi', 'philips', 'electrolux', 'consul', 'brastemp',
  'magazine luiza', 'casas bahia', 'ponto frio', 'submarino', 'americanas',
  'carrefour', 'mercado livre', 'amazon', 'kabum', 'pichau', 'terabyteshop',
  'shopee', 'aliexpress', 'whirlpool', 'fischer', 'mondial', 'oster', 'cuisinart',
  'black+decker', 'britânia', 'arno', 'multilaser', 'positivo', 'cce', 'semp',
  'tcl', 'multilaser', 'razer', 'hyperx', 'steelseries', 'redragon',
  'cougar', 'thermaltake', 'cooler master', 'deepcool', 'noctua', 'be quiet',
  'evga', 'galax', 'zotac', 'pny', 'adata', 'crucial', 'sandisk', 'seagate',
  'western digital', 'toshiba', 'samsung electronics', 'sk hynix', 'micron',
  'corsair memory', 'gskill', 'team group', 'xpg', 'patriot', 'mushkin',
  'dlink', 'tp-link', 'intelbras', 'multilaser', 'dx', 'whey', 'integralmed',
  'growth', 'max titanium', 'black skull', 'soldier', 'athletic', 'mizuno',
  'asics', 'puma', 'adidas', 'nike', 'oakley', 'ray-ban', 'vans', 'converse',
  'new balance', 'under armour', 'tommy hilfiger', 'lacoste', 'colcci',
  'reserva', 'armani', 'calvin klein', 'renner', 'marisa', 'riachuelo',
  'cea', 'perfumaria', 'natura', 'boticário', 'avon', 'jequiti', 'eudora',
  'loreal', 'maybelline', 'dove', 'rexona', 'clear', 'elseve', 'seda',
  'pampers', 'huggies', 'johnsons', 'bayer', 'petz', 'cobasi', 'royal canin',
  'whiskas', 'pedigree', 'golden', 'premier pet', 'nulo', 'farmina',
  'bic', 'stanley', 'tramontina', 'renner', 'brinox', 'rocker', 'inox',
  'bosch', 'makita', 'deWalt', 'skil', 'black & decker', 'vonder', 'tramontina pro',
  'fortgarden', 'scotch brite', '3m', 'brw', 'lorenzetti', 'fame', 'docol',
  'celite', 'decahome', 'tokstok', 'westwing', 'madeira madeira', 'etna',
  'oppo', 'oneplus', 'nothing', 'honor', 'huawei', 'realme', 'zte',
  'lenovo', 'vaio', 'positivo', 'acer', 'avell', 'razer blade', 'msi gaming',
  'gigabyte gaming', 'dell alienware', 'hp omen', 'lenovo legion', 'asus rog',
  'intelbras', 'taurus', 'prosafe', 'qnap', 'synology', 'ubiquiti',
]

const VERIFIED_STORES = [
  'mercado livre', 'kabum', 'amazon', 'aliexpress', 'shopee', 'magazine luiza',
  'casas bahia', 'ponto frio', 'submarino', 'americanas', 'carrefour',
  'pichau', 'terabyteshop', 'walmart', 'extra', 'fast shop', 'lojas americanas',
  'netshoes', 'zattini', 'dafiti', 'kanui', 'tricae', 'petz', 'cobasi',
]

export function checkSeller(sellerName: string, store: string, rating?: number, totalSales?: number): { isSafe: boolean; reason: string } {
  if (!sellerName || sellerName === store) {
    return { isSafe: true, reason: 'Produto da própria loja' }
  }

  const lower = sellerName.toLowerCase()

  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand)) {
      return { isSafe: true, reason: `Marca conhecida: ${brand}` }
    }
  }

  for (const vs of VERIFIED_STORES) {
    if (lower.includes(vs)) {
      return { isSafe: true, reason: `Loja verificada: ${vs}` }
    }
  }

  if (rating && rating >= 3.5 && totalSales && totalSales >= 10) {
    return { isSafe: true, reason: `Avaliação ${rating}/5 com ${totalSales} vendas` }
  }

  if (rating && rating >= 4.0) {
    return { isSafe: true, reason: `Avaliação alta: ${rating}/5` }
  }

  if (totalSales && totalSales >= 50) {
    return { isSafe: true, reason: `Muitas vendas: ${totalSales}` }
  }

  return { isSafe: false, reason: `Vendedor não verificado: ${sellerName}` }
}
