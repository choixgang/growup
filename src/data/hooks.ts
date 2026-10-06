import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { analyzeIngredients } from '../lib/rules'
import type { Meal, MonthNote, WeekNote } from '../lib/types'
import { repo } from './index'
import type { AppContext, SessionUser } from './repo'

export function useUser() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined)
  useEffect(() => {
    repo.getUser().then(setUser)
    return repo.onAuthChange(setUser)
  }, [])
  return user
}

export function useRecovering() {
  const [recovering, setRecovering] = useState(repo.isRecovering())
  useEffect(() => repo.onRecoveryChange(setRecovering), [])
  return recovering
}

export function useAppContext(enabled: boolean) {
  return useQuery({ queryKey: ['context'], queryFn: () => repo.getContext(), enabled })
}

export function useMeals(babyId: string) {
  return useQuery({ queryKey: ['meals', babyId], queryFn: () => repo.listMeals(babyId) })
}

export function useSaveMeal(babyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (meal: Omit<Meal, 'id' | 'updatedAt'> & { id?: string }) => repo.saveMeal(meal),
    onSuccess: (saved) => {
      qc.setQueryData<Meal[]>(['meals', babyId], (old = []) => [...old.filter((m) => m.id !== saved.id), saved])
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['meals', babyId] }),
  })
}

export function useDeleteMeal(babyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.deleteMeal(id),
    onMutate: (id) => {
      qc.setQueryData<Meal[]>(['meals', babyId], (old = []) => old.filter((m) => m.id !== id))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['meals', babyId] }),
  })
}

export function useMonthNote(babyId: string, month: string) {
  return useQuery({
    queryKey: ['monthNote', babyId, month],
    queryFn: async (): Promise<MonthNote> =>
      (await repo.getMonthNote(babyId, month)) ?? { babyId, month, stage: 'early', caution: '', goal: '' },
  })
}

export function useSaveMonthNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (note: MonthNote) => repo.saveMonthNote(note),
    onMutate: (note) => qc.setQueryData(['monthNote', note.babyId, note.month], note),
    onSettled: (_d, _e, note) => qc.invalidateQueries({ queryKey: ['monthNote', note.babyId, note.month] }),
  })
}

export function useWeekNote(babyId: string, weekStart: string) {
  return useQuery({
    queryKey: ['weekNote', babyId, weekStart],
    queryFn: async (): Promise<WeekNote> =>
      (await repo.getWeekNote(babyId, weekStart)) ?? { babyId, weekStart, memo: '', checklist: [] },
  })
}

export function useSaveWeekNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (note: WeekNote) => repo.saveWeekNote(note),
    onMutate: (note) => qc.setQueryData(['weekNote', note.babyId, note.weekStart], note),
    onSettled: (_d, _e, note) => qc.invalidateQueries({ queryKey: ['weekNote', note.babyId, note.weekStart] }),
  })
}

/** 배우자 기기의 변경을 받아 해당 데이터를 다시 불러온다 */
export function useRealtime(ctx: AppContext) {
  const qc = useQueryClient()
  useEffect(() => {
    return repo.subscribe(ctx.baby.id, ctx.household.id, (table) => {
      if (table === 'meals' || table === '*') qc.invalidateQueries({ queryKey: ['meals'] })
      if (table === 'month_notes' || table === '*') qc.invalidateQueries({ queryKey: ['monthNote'] })
      if (table === 'week_notes' || table === '*') qc.invalidateQueries({ queryKey: ['weekNote'] })
      if (table === 'context' || table === '*') qc.invalidateQueries({ queryKey: ['context'] })
    })
  }, [ctx.baby.id, ctx.household.id, qc])
}

export function useAnalysis(meals: Meal[] | undefined, ctx: AppContext) {
  return useMemo(
    () => analyzeIngredients(meals ?? [], ctx.household.testIntervalDays, ctx.household.knownIngredients),
    [meals, ctx.household.testIntervalDays, ctx.household.knownIngredients],
  )
}
