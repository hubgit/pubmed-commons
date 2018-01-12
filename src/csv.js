const fs = require('fs-extra')
const glob = require('glob')
const path = require('path')
const moment = require('moment')
const csvWriteStream = require('csv-write-stream')

const writer = csvWriteStream()
writer.pipe(fs.createWriteStream(__dirname + '/../data/comments.csv'))

const getIsoDate = comment => moment(comment.date, 'YYYY MMM DD hh:mm a').toString()

const getVotes = comment => {
  const matches = comment.votes.match(/(\d+) of (\d+)/)

  if (!matches) return null

  const [_, positive, total] = matches

  return { positive, total }
}

const getAuthorId = comment => {
  if (!comment.author_href) return null

  const matches = comment.author_href.match(/\/myncbi\/(.+?)\/comments\//)

  if (!matches) return null

  const [_, id] = matches

  return decodeURI(id)
}

const inputDir = __dirname + '/../data/parsed'
const files = glob.sync(inputDir + '/*.json')

files.forEach(file => {
  const comments = fs.readJsonSync(file)
  const pmid = path.basename(file, '.json')

  comments.forEach(comment => {
    const votes = getVotes(comment)

    if (!comment.date) return

    writer.write({
      pmid,
      id: comment.id,
      // date: comment.date,
      isodate: getIsoDate(comment),
      posVotes: votes ? votes.positive : 0,
      totalVotes: votes ? votes.total : 0,
      author: comment.author,
      authorId: getAuthorId(comment),
    })
  })
})
