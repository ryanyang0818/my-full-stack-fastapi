import { type APIRequestContext, expect } from "@playwright/test"

type Email = {
  id: number
  recipients: string[]
  subject: string
}

async function findEmail({
  request,
  filter,
}: {
  request: APIRequestContext
  filter?: (email: Email) => boolean
}) {
  const response = await request.get(`${process.env.MAILCATCHER_HOST}/messages`)

  let emails = await response.json()

  if (filter) {
    emails = emails.filter(filter)
  }

  const email = emails[emails.length - 1]

  if (email) {
    return email as Email
  }

  return null
}

export async function findLastEmail({
  request,
  filter,
  timeout = 15000,
}: {
  request: APIRequestContext
  filter?: (email: Email) => boolean
  timeout?: number
}): Promise<Email> {
  let latestEmail: Email | null = null
  const effectiveTimeout = Math.max(timeout, 15000)

  // 等待 MailCatcher 實際收信，避免後端寄信稍慢時測試偶發 timeout
  await expect
    .poll(
      async () => {
        latestEmail = await findEmail({ request, filter })
        return Boolean(latestEmail)
      },
      {
        intervals: [250, 500, 1000],
        message: "等待 MailCatcher 收到最新 email",
        timeout: effectiveTimeout,
      },
    )
    .toBe(true)

  return latestEmail as Email
}
