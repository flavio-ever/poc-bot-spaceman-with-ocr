import { executablePath } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Telegraf } from 'telegraf'

import { OpticalClass } from './classes/optical.class'
import { CoefficientClass } from './classes/coefficient.class'
import { CoefficientExeption } from './exceptions/coefficient.exception'

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

puppeteer.use(StealthPlugin())

const options = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process', // <- this one doesn't works in Windows
    '--disable-gpu',
    '--autoplay-policy=user-gesture-required',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-domain-reliability',
    '--disable-extensions',
    '--disable-features=AudioServiceOutOfProcess',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-setuid-sandbox',
    '--disable-speech-api',
    '--disable-sync',
    '--hide-scrollbars',
    '--ignore-gpu-blacklist',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--use-gl=swiftshader',
    '--use-mock-keychain'
  ],
  headless: false,
  executablePath: executablePath()
}

const optical = new OpticalClass()
const coefficient = new CoefficientClass()
const bot = new Telegraf(process.env.BOT_TELEGRAM_AUTH)
const botCanalId = process.env.BOT_TELEGRAN_ID_CHAT

puppeteer
  .launch(options)
  .then(async (browser) => {
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 })
    /**
     * Normalmente eu abro o jogo (com crédito real) e colo a url da iframe em page.goto(URL)
     * Se observar bem todos os sites de apostas que oferecem o Spaceman direcionam para a desenvolvedora softgamings.pragmaticplay,
     * porém, como obsevado cada casa parametriza seu jogo da sua forma, incluindo o acesso fora de iframe e etc.
     *
     * Caso deixe de funcionar com a pin-up, voce terá de re-parametrizar os apontamentos X,Y de imagem
     */
    await page.goto(
      'https://softgamings.pragmaticplay.net/gs2c/playGame.do?key=AAAAA'
    )
    // https://pin-up.world/br/casino/provider/pragmaticplay/spaceman?mode=real

    // await page.waitForNavigation({
    //   waitUntil: "networkidle0",
    // })

    try {
      for (let index = 0; index < 10000; index++) {
        const coefficientBuffer = await page.screenshot({
          path: 'oficina/prints/main.jpeg',
          type: 'jpeg',
          quality: 100,
          clip: {
            x: 600,
            y: 100,
            width: 400,
            height: 220
          }
        })

        try {
          const extractedCoefficient = await optical.extractOticalValue(
            coefficientBuffer,
            'coefficient-value',
            { x: 0, y: 230, width: 800, height: 170 }
          )
          const coeficienteCrashed = await optical.extractOticalValue(
            coefficientBuffer,
            'coefficient-crashed',
            { x: 0, y: 90, width: 800, height: 170 }
          )

          if (extractedCoefficient.length || coeficienteCrashed.length) {
            console.log('-----------------------------------------------')
            console.log('Tesseract coefficient: ', extractedCoefficient)
            console.log('Tesseract crashed: ', coeficienteCrashed)
          }

          // Validar output optico
          const { coefficientValue } = optical.map(
            extractedCoefficient,
            coeficienteCrashed
          )
          const sequenceOfCoefficients =
            coefficient.addTotalMultiplier(coefficientValue)

          const result = coefficient.validateResult(
            sequenceOfCoefficients.multiplier
          )

          if (result) {
            if (result.status === 'em_analise') {
              await bot.telegram.sendMessage(
                botCanalId,
                coefficient.analyzingPlay()
              )
            } else if (result.status === 'entrada_confirmada') {
              await bot.telegram.sendMessage(
                botCanalId,
                coefficient.entryConfirmed(result.input)
              )
            } else if (result.status === 'gale') {
              await bot.telegram.sendMessage(
                botCanalId,
                coefficient.confirmedDefeat(result.sequence[0])
              )
            } else if (result.status === 'vitoria') {
              await bot.telegram.sendMessage(
                botCanalId,
                coefficient.victoryConfirmed(result.sequence[0])
              )
            } else if (result.status === 'derrota') {
              await bot.telegram.sendMessage(
                botCanalId,
                coefficient.defeatConfirmed(result.sequence[0])
              )
            }
          }
        } catch (error) {
          if (error instanceof CoefficientExeption) {
            console.log(error.message, {
              idLog: error.idLog,
              request: error.request
            })
          } else {
            console.log(error.message)
          }
        }
        // await page.waitForTimeout(500)
      }

      await bot.launch()
    } catch (error) {
      // Enable graceful stop
      process.once('SIGINT', () => {
        bot.stop('SIGINT')
      })
      process.once('SIGTERM', () => {
        bot.stop('SIGTERM')
      })
    }
  })
  .catch(() => {})
