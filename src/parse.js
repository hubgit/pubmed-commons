const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')
const cheerio = require('cheerio')
// const moment = require('moment')

const outputDir = __dirname + '/../data/parsed'
fs.ensureDirSync(outputDir)

const inputDir = __dirname + '/../data/source'
const files = glob.sync(inputDir + '/*.json')

files.map(file => {
  const data = fs.readJsonSync(file)

  $ = cheerio.load(data.comments)

  const items = $('li').map((i, el) => {
    const node = $(el)

    // FIXME: for conversion, need to know the timezone of the original date
    // const date = node.find('.comm_date_d').text() // e.g. 2014 Mar 26 00:35 a.m.
    // https://momentjs.com/docs/#/parsing/string-format/
    // const isodate = moment(date, 'YYYY MMM DD hh:mm a').toString()

    return {
      id: node.attr('data-cmid'),
      date: node.find('.comm_date_d').text(),
      content: node.find('.comm_content').html(),
      url: 'http://www.ncbi.nlm.nih.gov' + node.find('.comm_permalink').attr('href'),
      votes: node.find('.comm_votes').text(),
      author: node.find('.comm_f_name').text(),
      author_href: node.find('.comm_f_name').attr('href'),
    }
  }).toArray()

  console.log(items)

  const id = path.basename(file, '.json')

  const output = `${outputDir}/${id}.json`

  fs.writeJsonSync(output, items)
})
