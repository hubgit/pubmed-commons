const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')
const cheerio = require('cheerio')

const outputDir = __dirname + '/../data/parsed'
fs.ensureDirSync(outputDir)

const inputDir = __dirname + '/../data/source'
const files = glob.sync(inputDir + '/*.json')

files.forEach(file => {
  const data = fs.readJsonSync(file)

  $ = cheerio.load(data.comments)

  const items = $('.comm_item').filter(el => {
    // ignore "This article was mentioned in a comment" comments
    return !$(el).find('.recip_see').length
  }).map((i, el) => {
    const node = $(el)

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

  const output = outputDir + '/' + path.basename(file)
  fs.writeJsonSync(output, items)
})
