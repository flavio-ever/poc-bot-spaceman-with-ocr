import { DefaultException } from './default.exception'

export class CoefficientExeption extends DefaultException {
  public request: string

  constructor (idLog: string, request = '', message: string) {
    super(`CoefficientExeption: ${message}`, idLog)
    this.request = JSON.stringify(request)
  }
}
