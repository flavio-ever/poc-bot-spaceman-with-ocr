export class DefaultException extends Error {
  public idLog: string

  constructor (message, idLog = '') {
    super(message)
    this.idLog = idLog
  }
}
