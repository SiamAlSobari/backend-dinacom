import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export function HttpResponse<T, M>(
    c: Context,
    message: string,
    status: ContentfulStatusCode,
    result: T,
    meta?: M
) {
    return c.json({ message, status, meta, data: result }, status)
}