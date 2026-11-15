import Dexie, { type EntityTable } from 'dexie';
export interface Habit { id?: number; name: string; category: string; frequency: string; color: string; createdAt: number; active: boolean }
export interface HabitLog { id?: number; habitId: number; date: string; completedAt: number }
export interface Task { id?: number; title: string; dueDate: string; priority: string; done: boolean; projectId?: number; createdAt: number }
export interface Goal { id?: number; title: string; targetDate: string; progress: number; createdAt: number }
export interface Project { id?: number; name: string; type: string; status: string; notes: string; createdAt: number }
export interface Note { id?: number; title: string; body: string; createdAt: number; updatedAt: number }
export interface MoneyEntry { id?: number; kind: 'دخل'|'مصروف'; amount: number; category: string; note: string; date: string; projectId?: number }
class LifeEraDB extends Dexie {
 habits!: EntityTable<Habit,'id'>; logs!: EntityTable<HabitLog,'id'>; tasks!: EntityTable<Task,'id'>; goals!: EntityTable<Goal,'id'>; projects!: EntityTable<Project,'id'>; notes!: EntityTable<Note,'id'>; money!: EntityTable<MoneyEntry,'id'>;
 constructor(){ super('LifeEraDB'); this.version(1).stores({habits:'++id,name,category,createdAt,active',logs:'++id,habitId,date,[habitId+date]'}); this.version(2).stores({habits:'++id,name,category,createdAt,active',logs:'++id,habitId,date,[habitId+date]',tasks:'++id,title,dueDate,priority,done,projectId,createdAt',goals:'++id,title,targetDate,createdAt',projects:'++id,name,type,status,createdAt',notes:'++id,title,createdAt,updatedAt',money:'++id,kind,date,category,projectId'}); }
}
export const db = new LifeEraDB();
