export class HttpException extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'Exception'
    this.status = status

    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace?.(this, this.constructor)
  }
}