"use strict";

function extractRanges(UnicodeData) {
  const fpost = ', First>'; const lpost = ', Last>'
  const fnamestart = 1; const fnameend = -fpost.length
  const rangePair = UnicodeData.filter(
    line => line[1].endsWith(fpost) || line[1].endsWith(lpost))
  const ranges = Array.from(
    Array(rangePair.length >> 1),
    (_, i) => rangePair.slice(i * 2, (i + 1) * 2))
  const extslist = ranges.map(([first, last]) => {
    const props = first.slice(2)
    const prefix = first[1].slice(fnamestart, fnameend).toUpperCase()
    const start = parseInt(first[0], 16); const end = parseInt(last[0], 16)
    return Array.from(Array(end - start + 1), (_, i) => {
      const hex = (start + i).toString(16).toUpperCase()
      const name = `${prefix}-${hex}`
      return [hex, name].concat(props)
    })
  })
  return UnicodeData.filter(
    line => !(line[1].endsWith(fpost) || line[1].endsWith(lpost)),
  ).concat(...extslist)
}

function makeDatabase(UnicodeData) {
  const database = {
    lookup: {},
    name: {},
    category: {},
    combining: {},
    bidirectional: {},
    decomposition: {},
    decompositionTag: {},
    decimal: {},
    digit: {},
    numeric: {},
    mirrored: {},
    unicode1name: {},
    isocomment: {},
    upper: {},
    lower: {},
    title: {},
  }

  function hex2str(hex) {
    return String.fromCodePoint(parseInt(hex, 16))
  }

  UnicodeData.forEach(line => {
    const char = String.fromCodePoint(parseInt(line[0], 16))
    database.name[char] = line[1]
    if (line[1][0] !== '<') database.lookup[line[1]] = char

    database.category[char] = line[2]
    database.combining[char] = parseInt(line[3])
    database.bidirectional[char] = line[4]

    if (line[5]) {
      const decompSeq = line[5].split(/ /)
      const tag = decompSeq[0].startsWith('<') ? decompSeq[0] : ''
      const decomp = decompSeq.slice(tag ? 1 : 0)
      database.decomposition[char] = decomp.map(hex2str).join('')
      database.decompositionTag[char] = tag
    }

    if (line[6]) database.decimal[char] = parseInt(line[6])
    if (line[7]) database.digit[char] = parseInt(line[7])
    if (line[8]) {
      database.numeric[char] = `${line[8]}`
    }

    database.mirrored[char] = line[9]

    if (line[10]) {
      database.unicode1name[char] = line[10]
      if (!database.lookup[line[10]]) database.lookup[line[10]] = char
    }
    if (line[11]) database.isocomment[char] = line[11]
    if (line[12]) database.upper[char] = hex2str(line[12])
    if (line[13]) database.lower[char] = hex2str(line[13])
    if (line[14]) database.title[char] = hex2str(line[14])
  })
  return database
}

function unicodeData() {
  const json = require("./UnicodeData.json");
  return json.map(line => line.split(/;/));
}

class UnicodeData {
  constructor() {
    this.database = makeDatabase(extractRanges(unicodeData()))
  }

  lookup(name, defaultch = '') {
    return this.database.lookup[name] || defaultch
  }

  name(ch, defaultname = '') {
    return this.database.name[ch] || defaultname
  }

  category(ch) {
    return this.database.category[ch]
  }

  combining(ch) {
    return this.database.combining[ch]
  }

  bidirectional(ch) {
    return this.database.bidirectional[ch]
  }

  decomposition(ch) {
    return this.database.decomposition[ch] || ch
  }

  decompositionTag(ch) {
    return this.database.decompositionTag[ch] || ''
  }

  decimal(ch, defaultval = NaN) {
    const r = this.database.decimal[ch]
    return typeof r === 'number' ? r : defaultval
  }

  digit(ch, defaultval = NaN) {
    const r = this.database.digit[ch]
    return typeof r === 'number' ? r : defaultval
  }

  numeric(ch, defaultval = NaN) {
    const r = this.database.numeric[ch]
    return typeof r === 'number' ? r : defaultval
  }

  mirrored(ch) {
    return this.database.mirrored[ch]
  }

  unicode1name(ch, defaultname = '') {
    return this.database.unicode1name[ch] || defaultname
  }

  lookupname(ch, defaultname = '') {
    const name = this.database.name[ch] || ''
    if (name && name[0] !== '<') return name
    return this.database.unicode1name[ch] || defaultname
  }

  isocomment(ch, defaultcomment = '') {
    return this.database.isocomment[ch] || defaultcomment
  }

  upper(ch, defaultch = '') {
    return this.database.upper[ch] || defaultch
  }

  lower(ch, defaultch = '') {
    return this.datbase.lower[ch] || defaultch
  }

  title(ch, defaultch = '') {
    return this.database.title[ch] || defaultch
  }

  splitCombined(text) {
    const chars = Array.from(text)
    const bases = chars.map((ch, i) => ({ ch, i })).filter(
      ({ ch }) => this.database.combining[ch] === 0,
    ).map(({ ch, i }) => i)
    return bases.map(
      (start, i) => chars.slice(start, bases[i + 1]).join(''))
  }
}

export default UnicodeData
