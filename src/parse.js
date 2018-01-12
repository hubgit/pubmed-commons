const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')
const cheerio = require('cheerio')
const moment = require('moment')
const csvWriteStream = require('csv-write-stream')

const csvWriter = csvWriteStream()
csvWriter.pipe(fs.createWriteStream(__dirname + '/../data/comments.csv'))

const outputDir = __dirname + '/../data/parsed'
fs.ensureDirSync(outputDir)

const inputDir = __dirname + '/../data/source'
const files = glob.sync(inputDir + '/*.json')

const parseVotes = node => {
  const matches = node.find('.comm_votes').text().match(/(\d+) of (\d+)/)

  if (!matches) return null

  const [_, positive, total] = matches

  return { positive, total }
}

files.forEach(file => {
  const pmid = path.basename(file, '.json')

  const data = fs.readJsonSync(file)

  $ = cheerio.load(data.comments)

  const items = $('.comm_item').filter((i, el) => {
    // ignore "This article was mentioned in a comment" comments
    return !$(el).find('.recip_see').length
  }).map((i, el) => {
    const node = $(el)

    const votes = parseVotes(node)
    const url = node.find('.comm_permalink').attr('href')

    const item = {
      article: 'https://pubmed.gov/' + pmid,
      id: node.attr('data-cmid'),
      // date: node.find('.comm_date_d').text(),
      date: moment(node.find('.comm_date_d').text(), 'YYYY MMM DD hh:mm a').toISOString(),
      url: url ? 'http://www.ncbi.nlm.nih.gov' + url : null,
      positiveVotes: votes ? votes.positive : 0,
      totalVotes: votes ? votes.total : 0,
      moderated: node.find('.not_appr').length,
      author: node.find('.comm_f_name').text(),
      authorUrl: 'http://www.ncbi.nlm.nih.gov' + node.find('.comm_f_name').attr('href'),
    }

    csvWriter.write(item)

    item.content = node.find('.comm_content').html()

    return item
  }).toArray()

  const output = outputDir + '/' + path.basename(file)
  fs.writeJsonSync(output, items)
})
