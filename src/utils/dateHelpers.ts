import { addDays, format, differenceInDays, parseISO } from 'date-fns'
import { GESTATION_DAYS, PREGNANCY_CHECK_DAYS } from '../lib/constants'

export function calculateCalvingDate(aiDate: string): string {
  return format(addDays(parseISO(aiDate), GESTATION_DAYS), 'yyyy-MM-dd')
}

export function calculatePregnancyCheckDate(aiDate: string): string {
  return format(addDays(parseISO(aiDate), PREGNANCY_CHECK_DAYS), 'yyyy-MM-dd')
}

export function calculateAge(birthDate: string): string {
  const days = differenceInDays(new Date(), parseISO(birthDate))
  if (days < 30) return `${days} days`
  if (days < 365) return `${Math.floor(days / 30)} months`
  return `${Math.floor(days / 365)} years`
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}