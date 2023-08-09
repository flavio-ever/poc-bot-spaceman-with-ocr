import Tesseract from 'tesseract.js'
import Jimp from 'jimp'

type IAdapter = {
  coefficientValue: number
  crashedCoefficient: string
}

export class OpticalClass {
  map (coefficient: string, crashed: string): IAdapter {
    const crashedNoSpecials = crashed.replace(/[^\w\s]|_/g, '')
    const foundCrashed = /CRASHED/g.test(crashedNoSpecials)
    if (!foundCrashed) {
      throw new Error(
        `A palavra 'CRASHED' não foi encontrada na string: '${crashed}'`
      )
    }

    const coefficientFormatted = coefficient.replace(/[^0-9]/g, '')
    if (!/^[0-9]+$/.test(coefficientFormatted)) {
      throw new Error(`Não foi possível formatar: '${coefficient}'`)
    }

    return {
      coefficientValue: Number(coefficientFormatted),
      crashedCoefficient: crashedNoSpecials
    }
  }

  async extractOticalValue (
    screenshotBuffer: any,
    imageName: string,
    imageProps: any
  ): Promise<any> {
    let tesseractResult = ''

    // Carrega a imagem em Jimp
    const image = await Jimp.read(screenshotBuffer)

    const clip = {
      x: imageProps.x,
      y: imageProps.y,
      width: imageProps.width,
      height: imageProps.height
    }

    // Corta a imagem
    image.crop(clip.x, clip.y, clip.width, clip.height)

    await image.writeAsync(
      `oficina/prints/evidencia_processada_${imageName}_antes.jpg`
    )

    // Reduz o ruído e melhora a qualidade da imagem
    image
      .greyscale()
      .brightness(0.5)
      .contrast(0.6)
      .posterize(2)
      .normalize()
      .invert()

    await image.writeAsync(
      `oficina/prints/evidencia_processada_${imageName}_depois.jpg`
    )

    // Converte a imagem em base64 para o Tesseract.js
    const base64ImageNumero = await image.getBase64Async(Jimp.MIME_JPEG)

    await Tesseract.recognize(base64ImageNumero, 'eng')
      .then(async ({ data: { text } }) => {
        tesseractResult = text
      })
      .catch(() => {})

    return tesseractResult
  }
}
