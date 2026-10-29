/** Retorno padrao das Server Actions: sucesso com dado, ou erro com mensagem. */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
