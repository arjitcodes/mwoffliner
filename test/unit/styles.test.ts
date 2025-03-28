import RedisStore from '../../src/RedisStore.js'
import { startRedis, stopRedis } from './bootstrap.js'
import { setupScrapeClasses } from '../util.js'
import { getAndProcessStylesheets, mwRetToArticleDetail } from '../../src/util/index.js'
import Axios from 'axios'
import { jest } from '@jest/globals'
import Downloader from '../../src/Downloader.js'

jest.setTimeout(10000)

describe('Styles', () => {
  beforeAll(startRedis)
  afterAll(stopRedis)

  test('Stylesheet downloading', async () => {
    const { articleDetailXId } = RedisStore
    await setupScrapeClasses() // en wikipedia

    const _articlesDetail = await Downloader.getArticleDetailsIds(['London'])
    const articlesDetail = mwRetToArticleDetail(_articlesDetail)
    await articleDetailXId.flush()
    await articleDetailXId.setMany(articlesDetail)

    const offlineCSSUrl = 'https://wiki.kiwix.org/w/index.php?title=Mediawiki:offline.css&action=raw'
    const siteStylesUrl = 'https://en.wikipedia.org/w/load.php?lang=en&modules=site.styles&only=styles&skin=vector'

    const { data: offlineCSSContent } = await Axios.get(offlineCSSUrl)
    const { data: siteStylesContent } = await Axios.get(siteStylesUrl)

    const { finalCss } = await getAndProcessStylesheets([offlineCSSUrl, siteStylesUrl])

    // Contains offline CSS url
    expect(finalCss.includes(offlineCSSUrl)).toBeDefined()
    // Contains offline CSS content
    expect(finalCss.includes(offlineCSSContent)).toBeDefined()

    // Contains site CSS url
    expect(finalCss.includes(siteStylesUrl)).toBeDefined()
    // Contains re-written site CSS content
    expect(!finalCss.includes(siteStylesContent)).toBeDefined()
  })
})
