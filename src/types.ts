export interface Todo {
    id: number;
    title: string;
    completed: boolean;
    position: number;
    due_date: string | null; // "YYYY-MM-DD" or null
    created_at: string;
  }
  
  // Shape sent when creating a todo — server assigns id/position/created_at
  export interface NewTodo {
    title: string;
    due_date?: string | null;
  }
  
  // Partial update — used for "toggle completed", "rename", or "change due date"
  export interface TodoUpdate {
    title?: string;
    completed?: boolean;
    due_date?: string | null;
  }
  
  // The single notes scratchpad
  export interface Note {
    id: number;
    content: string;
    updated_at: string;
  }