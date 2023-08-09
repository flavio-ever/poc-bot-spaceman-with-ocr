import { CoefficientExeption } from '../exceptions/coefficient.exception'

type IValidateResult = {
  status: string
  sequence: number[]
  hits: number
  gales: number
  defeats: number
  input: number
}

type IAddTotalMultiplier = {
  multiplier: number
  multipliersTotals: number[]
}

export class CoefficientClass {
  // TODO Range de cores (sem uso)
  COR_CINZA_LIST = [100, 100]
  COR_CIANO_LIST = [101, 199]
  COR_INDIGO_lIST = [200, 599]
  COR_ROSA_CARMIN_LIST = [600, 2599]
  COR_MAGENTO_LIST = [2600, 9999]

  // TODO Valida range de cores (sem uso)
  validateColor (rangeColor, colorList): boolean {
    if (rangeColor >= colorList[0] && rangeColor <= colorList[1]) {
      return true
    } else {
      return false
    }
  }

  private multipliersTotals = []
  private currentMultipliers = []
  private hitTotals = 0
  private totalsOfGales = 0
  private lossTotals = 0
  private multiplierInput = 0

  addTotalMultiplier (multiplier): IAddTotalMultiplier {
    // Os numeros não podem repetir a primeira position
    if (
      this.multipliersTotals.length &&
      this.multipliersTotals[0] === multiplier
    ) {
      throw new CoefficientExeption(
        'FlagRules.sequencermultiplier',
        multiplier,
        'Os numeros nao podem se repetir na primeira position'
      )
    }

    if (this.multipliersTotals.length === 20) {
      console.log(
        'Chegamos a 20 bandeiras, limpando o cache da memoria',
        this.multipliersTotals
      )
      this.multipliersTotals = [multiplier]
    } else {
      this.multipliersTotals.unshift(multiplier)
    }

    return {
      multiplier,
      multipliersTotals: this.multipliersTotals
    }
  }

  analyzingPlay (): string {
    const percentageWins =
      (this.hitTotals / (this.hitTotals + this.lossTotals)) *
        100 || 0
    const lastMultipliers = this.currentMultipliers
      .map((multiplier: string) => `${multiplier}x`)
      .join(' | ')

    return `
    🔍 ANALISANDO 🔍
    ---------------------------------------
    
    🚥 Últimos multiplieres: ${lastMultipliers}
    
    ☘️ Total de vitorias: ${this.hitTotals}
    
    ⚠️ Total de gales: ${this.totalsOfGales}
    
    ❌ Total de derrotas:  ${this.lossTotals}
    
    🚀 Desempenho: ${percentageWins}% de vitórias
    
    ---------------------------------------
    📱 Cadastre-se ja: http://algumsite.com.br
    `
  }

  entryConfirmed (coefficient: number): string {
    return `
    ✅ ENTRADA CONFIRMADA ✅
    ---------------------------------------

    🎲 Estratégia: Funcionalidade não disponível

    🚥 Entrar após: ${coefficient}
    
    📤 Saída até: 2.00x

    ---------------------------------------
    📱 Cadastre-se ja: http://algumsite.com.br
    `
  }

  confirmedDefeat (coefficient: number): string {
    return `
    ⚠️ GALE ⚠️
    ---------------------------------------

    🎲 Estratégia: Funcionalidade não disponível

    🚥 Entrar após: ${coefficient}x

    📤 Saída até: 2.00x

    --------------------------------------
    📱 Cadastre-se ja: http://algumsite.com.br
    `
  }

  victoryConfirmed (coefficient: number): string {
    return `
    VITOOOORIA SENHORES(AS) 🍷🗿
    --------------------------------------

    ☘️ Vitoria em: ${coefficient}

    --------------------------------------
    📱 Cadastre-se ja: http://algumsite.com.br
    `
  }

  defeatConfirmed (coefficient: number): string {
    return `
    DERROTA SENHORES(AS) 😢
    --------------------------------------

    ❌ Derrota em: ${coefficient}

    --------------------------------------
    📱 Cadastre-se ja: http://algumsite.com.br
    `
  }

  /**
   * TODO: O metodo é parametrizado manualmente apenas para probabilidades que estudei e não é 100%
   * TODO: Recomendo estudar a possiblidade de tornar ele dinâmico
   */
  validateResult (multiplier: number): IValidateResult {
    // Adiciona multiplier independente do valor
    this.currentMultipliers.unshift(multiplier)

    let status = 'em_analise'

    // Regra 1: No quarto multiplier, pedir para apostar no quinto multiplier
    if (this.currentMultipliers.length === 4) {
      this.multiplierInput = this.currentMultipliers[0]
      status = 'entrada_confirmada'
    }

    // O Array indica a position de vezes toleradas para se considerar um vitoria/gale/derrota
    [5, 6, 7].forEach((position) => {
      if (this.currentMultipliers.length === position) {
        if (multiplier < 200) {
          this.totalsOfGales += 1
          status = 'gale'
        } else {
          // multiplier de acerto: Reseta multiplier com ultima position
          this.currentMultipliers = [multiplier]
          this.hitTotals += 1
          this.multiplierInput = 0
          status = 'vitoria'
        }

        // multiplier final: Reseta multiplier com ultima position
        if (position === 7) {
          this.multiplierInput = 0
          this.currentMultipliers = [multiplier]
          if (multiplier < 200) {
            this.lossTotals += 1
            status = 'derrota'
          }
        }
      }
    })

    return {
      status,
      sequence: this.currentMultipliers,
      hits: this.hitTotals,
      gales: this.totalsOfGales,
      defeats: this.lossTotals,
      input: this.multiplierInput
    }
  }
}
