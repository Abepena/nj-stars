interface MerchDropLike {
  is_active: boolean
  has_dropped?: boolean
  drop_date?: string | null
}

export function hasMerchDropPassed(dropDate?: string | null) {
  if (!dropDate) return false
  const dropTime = new Date(dropDate).getTime()
  if (Number.isNaN(dropTime)) return false
  return dropTime <= Date.now()
}

export function isMerchDropAnnouncementActive(settings?: MerchDropLike | null) {
  if (!settings?.is_active) return false
  if (settings.has_dropped) return false
  if (hasMerchDropPassed(settings.drop_date)) return false
  return true
}
