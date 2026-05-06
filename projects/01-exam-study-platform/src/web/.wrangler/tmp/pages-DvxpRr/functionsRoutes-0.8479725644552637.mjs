import { onRequestGet as __api_session_ts_onRequestGet } from "D:\\Anson\\PersonalWorkFlow\\projects\\01-exam-study-platform\\src\\web\\functions\\api\\session.ts"
import { onRequest as __data_subjects__middleware_ts_onRequest } from "D:\\Anson\\PersonalWorkFlow\\projects\\01-exam-study-platform\\src\\web\\functions\\data\\subjects\\_middleware.ts"

export const routes = [
    {
      routePath: "/api/session",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_session_ts_onRequestGet],
    },
  {
      routePath: "/data/subjects",
      mountPath: "/data/subjects",
      method: "",
      middlewares: [__data_subjects__middleware_ts_onRequest],
      modules: [],
    },
  ]