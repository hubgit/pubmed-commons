const fs = require('fs-extra')
const resource = require('fetch-resource')

const outputDir = __dirname + '/../data/source'
fs.ensureDirSync(outputDir)

const fetchComments = async id => {
  const data = await resource('http://www.ncbi.nlm.nih.gov/myncbi/comments/', {
    'p$rq': 'CommL.CommServer:com',
    cmd: 'get',
    recid: id
  }).fetch('json')

  const output = `${outputDir}/${id}.json`

  if (!fs.existsSync(output)) {
    fs.writeJsonSync(output, data)
  }
}

const retmax = 100

// https://www.ncbi.nlm.nih.gov/pubmed/?term=has_user_comments%5Bfilter%5D

const fetch = async (retstart = 0) => {
  const data = await resource('http://eutils.be-md.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi', {
    db: 'pubmed',
    term: 'has_user_comments[filter]',
    retmode: 'json',
    retmax,
    retstart,
  }).fetch('json')

  await Promise.all(data['esearchresult']['idlist'].map(fetchComments))

  retstart += retmax

  if (retstart < Number(data['esearchresult']['count'])) {
    await fetch(retstart)
  }
}

fetch().then(() => {
  console.log('Finished')
}).catch(e => {
  console.error(e)
})
